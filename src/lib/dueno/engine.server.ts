import type { Json } from "@/integrations/supabase/types";
/**
 * The automation engine: first message, 3-day follow-ups, inbound replies,
 * verified payment closure and receipts.
 *
 * Everything here runs with the service-role client, so every single query is
 * explicitly scoped by user_id / invoice_id. Nothing ever fans out across users.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { formatMoney, daysBetween, DEFAULT_RECEIPT_FIELDS, type ReceiptFields } from "./shared";
import type { InvoiceContext } from "./guardrails.server";
import { claimsPayment, fillTemplate } from "./guardrails.server";
import { generateEmailReminder, generatePayerReply } from "./ai.server";
import {
  emailConfigured,
  sendEmail,
  sendWhatsapp,
  textToHtml,
  whatsappConfigured,
} from "./messaging.server";
import { createInvoicePaymentLink } from "./stripe.server";

type Stage = "first" | "followup_1" | "followup_2" | "final";
const NEXT_STAGE: Record<Stage, Stage> = {
  first: "followup_1",
  followup_1: "followup_2",
  followup_2: "final",
  final: "final",
};

export type LoadedInvoice = {
  id: string;
  user_id: string;
  client_id: string;
  reference: string | null;
  amount_cents: number;
  currency: string;
  description: string | null;
  due_date: string;
  status: string;
  file_path: string | null;
  preferred_channel: string | null;
  payment_link_url: string | null;
  client: { id: string; name: string; email: string | null; whatsapp_number: string | null };
  profile: {
    business_name: string | null;
    contact_details: string | null;
    email: string | null;
    stripe_account_id: string | null;
    stripe_onboarding_complete: boolean;
    receipt_fields: ReceiptFields;
  };
};

/** Load exactly one invoice plus its own client and its own owner's profile. */
export async function loadInvoice(invoiceId: string): Promise<LoadedInvoice | null> {
  const { data: invoice } = await supabaseAdmin
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice) return null;

  const [{ data: client }, { data: profile }] = await Promise.all([
    supabaseAdmin
      .from("clients")
      .select("id, name, email, whatsapp_number, user_id")
      .eq("id", invoice.client_id)
      .maybeSingle(),
    supabaseAdmin
      .from("profiles")
      .select(
        "business_name, contact_details, email, stripe_account_id, stripe_onboarding_complete, receipt_fields",
      )
      .eq("user_id", invoice.user_id)
      .maybeSingle(),
  ]);

  // Defensive ownership assertion: a client must belong to the invoice's owner.
  if (!client || client.user_id !== invoice.user_id) return null;

  return {
    ...invoice,
    client: {
      id: client.id,
      name: client.name,
      email: client.email,
      whatsapp_number: client.whatsapp_number,
    },
    profile: {
      business_name: profile?.business_name ?? null,
      contact_details: profile?.contact_details ?? null,
      email: profile?.email ?? null,
      stripe_account_id: profile?.stripe_account_id ?? null,
      stripe_onboarding_complete: profile?.stripe_onboarding_complete ?? false,
      receipt_fields: (profile?.receipt_fields as ReceiptFields) ?? DEFAULT_RECEIPT_FIELDS,
    },
  } as LoadedInvoice;
}

export function buildContext(invoice: LoadedInvoice): InvoiceContext {
  const due = new Date(`${invoice.due_date}T00:00:00Z`);
  return {
    invoiceId: invoice.id,
    payerName: invoice.client.name,
    businessName: invoice.profile.business_name ?? "your supplier",
    reference: invoice.reference ?? invoice.id.slice(0, 8).toUpperCase(),
    amountLabel: formatMoney(invoice.amount_cents, invoice.currency),
    dueDateLabel: due.toUTCString().slice(5, 16),
    description: invoice.description ?? "",
    paymentLink: invoice.payment_link_url,
    hasInvoiceFile: Boolean(invoice.file_path),
    overdueDays: Math.max(0, -daysBetween(new Date(), due)),
  };
}

async function logAi(params: {
  userId: string;
  invoiceId: string;
  kind: string;
  model?: string;
  blocked?: boolean;
  reason?: string | undefined;
  detail?: Record<string, unknown>;
}) {
  await supabaseAdmin.from("ai_events").insert({
    user_id: params.userId,
    invoice_id: params.invoiceId,
    kind: params.kind,
    model: params.model ?? null,
    blocked: params.blocked ?? false,
    block_reason: params.reason ?? null,
    detail: (params.detail ?? null) as Json | null,
  });
}

async function recordMessage(params: {
  invoice: LoadedInvoice;
  channel: "whatsapp" | "email" | "system";
  direction: "outbound" | "inbound" | "system";
  body: string;
  templateKey?: string | null;
  providerMessageId?: string | null;
  attachmentPath?: string | null;
}) {
  await supabaseAdmin.from("messages").insert({
    user_id: params.invoice.user_id,
    invoice_id: params.invoice.id,
    client_id: params.invoice.client_id,
    channel: params.channel,
    direction: params.direction,
    body: params.body,
    template_key: params.templateKey ?? null,
    provider_message_id: params.providerMessageId ?? null,
    attachment_path: params.attachmentPath ?? null,
  });
}

function contactChannel(invoice: LoadedInvoice): "whatsapp" | "email" | null {
  if (invoice.client.whatsapp_number) return "whatsapp";
  if (invoice.client.email) return "email";
  return null;
}

export function chooseChannel(invoice: LoadedInvoice): "whatsapp" | "email" | null {
  const hasWa = Boolean(invoice.client.whatsapp_number) && whatsappConfigured();
  const hasEmail = Boolean(invoice.client.email) && emailConfigured();
  if (invoice.preferred_channel === "email" && hasEmail) return "email";
  if (invoice.preferred_channel === "whatsapp" && hasWa) return "whatsapp";
  if (hasWa) return "whatsapp";
  if (hasEmail) return "email";
  return null;
}

/** Create the invoice's unique payment link once the user's Stripe account is live. */
export async function ensurePaymentLink(invoice: LoadedInvoice): Promise<LoadedInvoice> {
  if (invoice.payment_link_url) return invoice;
  if (!invoice.profile.stripe_account_id || !invoice.profile.stripe_onboarding_complete) {
    return invoice;
  }
  try {
    const url = await createInvoicePaymentLink({
      connectedAccountId: invoice.profile.stripe_account_id,
      invoiceId: invoice.id,
      amountCents: invoice.amount_cents,
      currency: invoice.currency,
      reference: invoice.reference ?? invoice.id.slice(0, 8).toUpperCase(),
      description: invoice.description ?? "Invoice",
      businessName: invoice.profile.business_name ?? "Dueno",
    });
    await supabaseAdmin.from("invoices").update({ payment_link_url: url }).eq("id", invoice.id);
    return { ...invoice, payment_link_url: url };
  } catch (error) {
    console.error("[dueno] payment link failed", error);
    return invoice;
  }
}

/** Has the payer ever replied on WhatsApp in the last 24h (Meta free-form window)? */
async function whatsappWindowOpen(invoice: LoadedInvoice): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data } = await supabaseAdmin
    .from("messages")
    .select("id")
    .eq("invoice_id", invoice.id)
    .eq("direction", "inbound")
    .eq("channel", "whatsapp")
    .gte("created_at", since)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function pickTemplate(stage: Stage, invoiceId: string) {
  const { data: variants } = await supabaseAdmin
    .from("message_templates")
    .select("template_key, body")
    .eq("stage", stage)
    .eq("active", true);
  if (!variants?.length) return null;

  const { data: used } = await supabaseAdmin
    .from("messages")
    .select("template_key")
    .eq("invoice_id", invoiceId)
    .not("template_key", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);

  const lastKey = used?.[0]?.template_key ?? null;
  const fresh = variants.filter((v) => v.template_key !== lastKey);
  const pool = fresh.length ? fresh : variants;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

async function invoiceAttachment(invoice: LoadedInvoice) {
  if (!invoice.file_path) return null;
  const { data } = await supabaseAdmin.storage.from("invoice-files").download(invoice.file_path);
  if (!data) return null;
  const buffer = Buffer.from(await data.arrayBuffer());
  if (buffer.byteLength > 8 * 1024 * 1024) return null;
  return {
    filename: invoice.file_path.split("/").pop() ?? "invoice",
    contentBase64: buffer.toString("base64"),
  };
}

/** Send one reminder for a stage, then arm the next 3-day follow-up. */
export type { Stage };
export async function sendReminder(invoiceId: string, stage: Stage): Promise<string> {
  let invoice = await loadInvoice(invoiceId);
  if (!invoice) return "not_found";
  if (["paid", "cancelled"].includes(invoice.status)) return "closed";

  invoice = await ensurePaymentLink(invoice);
  // If sending isn't connected yet, Dueno still writes the message so the owner can see it.
  const channel = chooseChannel(invoice) ?? contactChannel(invoice);
  if (!channel) {
    await recordMessage({
      invoice,
      channel: "system",
      direction: "system",
      body: "Reminder could not be written: this payer has no WhatsApp number or email.",
    });
    return "no_channel";
  }

  const ctx = buildContext(invoice);
  const template = await pickTemplate(stage, invoice.id);
  const templateBody =
    template?.body ??
    "Hi {{payer}}, this is DuenoPay on behalf of {{business}}. Invoice {{ref}} for {{amount}} is due {{due}}. Pay here: {{link}}.";

  let body: string;
  let templateKey: string | null = null;

  if (channel === "whatsapp") {
    // Meta only allows approved templates outside the 24h reply window — unless we
    // can't send yet anyway, in which case Dueno shows its own draft.
    const freeForm = !whatsappConfigured() || (await whatsappWindowOpen(invoice));
    if (freeForm) {
      const out = await generateEmailReminder(ctx, stage, templateBody);
      body = out.text;
      await logAi({
        userId: invoice.user_id,
        invoiceId: invoice.id,
        kind: "whatsapp_freeform_reminder",
        model: out.model,
        blocked: out.blocked,
        reason: out.reason,
      });
    } else {
      // Outside the 24h window Meta only allows pre-approved templates.
      body = fillTemplate(templateBody, ctx);
      templateKey = template?.template_key ?? null;
    }
  } else {
    const out = await generateEmailReminder(ctx, stage, templateBody);
    body = out.text;
    await logAi({
      userId: invoice.user_id,
      invoiceId: invoice.id,
      kind: "email_reminder",
      model: out.model,
      blocked: out.blocked,
      reason: out.reason,
    });
  }

  let result;
  if (channel === "whatsapp") {
    result = await sendWhatsapp({ to: invoice.client.whatsapp_number!, body });
  } else {
    const attachment = stage === "first" ? await invoiceAttachment(invoice) : null;
    result = await sendEmail({
      to: invoice.client.email!,
      subject: `${ctx.amountLabel} outstanding — invoice ${ctx.reference} from ${ctx.businessName}`,
      html: textToHtml(body),
      attachment,
    });
  }

  await recordMessage({
    invoice,
    channel,
    direction: "outbound",
    body: result.delivered ? body : `${body}\n\n[not delivered: ${result.error}]`,
    templateKey,
    providerMessageId: result.providerMessageId,
    attachmentPath: stage === "first" ? invoice.file_path : null,
  });

  const next = new Date();
  next.setUTCDate(next.getUTCDate() + 3);
  await supabaseAdmin
    .from("follow_up_schedules")
    .upsert(
      {
        user_id: invoice.user_id,
        invoice_id: invoice.id,
        next_send_at: next.toISOString(),
        stage: NEXT_STAGE[stage],
        last_sent_at: new Date().toISOString(),
        active: true,
      },
      { onConflict: "invoice_id" },
    );

  if (invoice.status === "pending") {
    await supabaseAdmin.from("invoices").update({ status: "active" }).eq("id", invoice.id);
  }

  return result.delivered ? "sent" : `failed:${result.error}`;
}

/** Called after an invoice row is created. Never throws into the request path. */
export async function startInvoiceConversation(invoiceId: string): Promise<void> {
  try {
    await sendReminder(invoiceId, "first");
  } catch (error) {
    console.error("[dueno] first message failed", error);
  }
}

/** Handle an inbound payer reply. Scoped to one invoice, always. */
export async function handleInboundReply(params: {
  channel: "whatsapp" | "email";
  fromContact: string;
  text: string;
  providerMessageId: string | null;
}): Promise<string> {
  const column = params.channel === "whatsapp" ? "whatsapp_number" : "email";
  const { data: clients } = await supabaseAdmin
    .from("clients")
    .select("id, user_id")
    .eq(column, params.fromContact)
    .limit(25);

  if (!clients?.length) return "unknown_sender";

  // Most recent still-open invoice belonging to one of the matching clients.
  const { data: candidates } = await supabaseAdmin
    .from("invoices")
    .select("id, client_id, created_at")
    .in(
      "client_id",
      clients.map((c) => c.id),
    )
    .in("status", ["pending", "active", "overdue", "pending_manual_confirmation"])
    .order("created_at", { ascending: false })
    .limit(1);

  const target = candidates?.[0];
  if (!target) return "no_open_invoice";

  const invoice = await loadInvoice(target.id);
  if (!invoice) return "not_found";

  await recordMessage({
    invoice,
    channel: params.channel,
    direction: "inbound",
    body: params.text.slice(0, 4000),
    providerMessageId: params.providerMessageId,
  });

  const ctx = buildContext(invoice);

  // An unverified payment claim never closes an invoice — it asks the user.
  if (claimsPayment(params.text) && invoice.status !== "paid") {
    await supabaseAdmin
      .from("invoices")
      .update({ status: "pending_manual_confirmation" })
      .eq("id", invoice.id);
    await recordMessage({
      invoice,
      channel: "system",
      direction: "system",
      body:
        "The payer says they have already paid, but no verified payment was found. " +
        "This invoice is waiting for your confirmation and has not been marked paid.",
    });
  }

  const reply = await generatePayerReply(ctx, params.text);
  await logAi({
    userId: invoice.user_id,
    invoiceId: invoice.id,
    kind: "payer_reply",
    model: reply.model,
    blocked: reply.blocked,
    reason: reply.reason,
  });

  const result =
    params.channel === "whatsapp"
      ? await sendWhatsapp({ to: invoice.client.whatsapp_number!, body: reply.text })
      : await sendEmail({
          to: invoice.client.email!,
          subject: `Re: invoice ${ctx.reference} from ${ctx.businessName}`,
          html: textToHtml(reply.text),
        });

  await recordMessage({
    invoice,
    channel: params.channel,
    direction: "outbound",
    body: result.delivered ? reply.text : `${reply.text}\n\n[not delivered: ${result.error}]`,
    providerMessageId: result.providerMessageId,
  });

  return "handled";
}

function esc(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function receiptHtml(invoice: LoadedInvoice): string {
  const f = invoice.profile.receipt_fields ?? DEFAULT_RECEIPT_FIELDS;
  const rows: string[] = [];
  const add = (label: string, value: string) =>
    rows.push(
      `<tr><td style="padding:6px 16px 6px 0;color:#667">${label}</td><td style="padding:6px 0;font-weight:600">${esc(value)}</td></tr>`,
    );

  if (f.invoice_ref) add("Invoice", invoice.reference ?? invoice.id.slice(0, 8).toUpperCase());
  if (f.payer_name) add("Paid by", invoice.client.name);
  if (f.amount_paid) add("Amount paid", formatMoney(invoice.amount_cents, invoice.currency));
  if (f.date_paid) add("Date paid", new Date().toUTCString().slice(5, 16));

  const header = f.business_name
    ? `<h2 style="margin:0 0 4px;font-size:20px">${esc(invoice.profile.business_name ?? "Receipt")}</h2>`
    : "<h2 style='margin:0 0 4px;font-size:20px'>Receipt</h2>";

  return `
  <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #e6e3dc;border-radius:12px">
    ${header}
    <p style="margin:0 0 18px;color:#667">Payment received — receipt</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${rows.join("")}</table>
    ${f.thank_you ? `<p style="margin:20px 0 0;line-height:1.6">${esc(f.thank_you)}</p>` : ""}
    ${f.contact_details && invoice.profile.contact_details ? `<p style="margin:14px 0 0;color:#667;font-size:13px">${esc(invoice.profile.contact_details)}</p>` : ""}
    <p style="margin:22px 0 0;color:#99968f;font-size:12px">Sent by DuenoPay on behalf of ${esc(invoice.profile.business_name ?? "the business")}.</p>
  </div>`;
}

/** Only ever called from a signature-verified Stripe webhook. */
export async function markInvoicePaid(invoiceId: string, paymentIntentId: string | null) {
  const invoice = await loadInvoice(invoiceId);
  if (!invoice || invoice.status === "paid") return;

  await supabaseAdmin
    .from("invoices")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: paymentIntentId,
    })
    .eq("id", invoiceId);

  await supabaseAdmin
    .from("follow_up_schedules")
    .update({ active: false })
    .eq("invoice_id", invoiceId);

  const paid = { ...invoice, status: "paid" } as LoadedInvoice;
  const html = receiptHtml(paid);
  const ctx = buildContext(paid);

  if (invoice.client.email && emailConfigured()) {
    const res = await sendEmail({
      to: invoice.client.email,
      subject: `Receipt — ${ctx.amountLabel} paid to ${ctx.businessName}`,
      html,
    });
    await recordMessage({
      invoice: paid,
      channel: "email",
      direction: "outbound",
      body: `Receipt sent for ${ctx.amountLabel} (invoice ${ctx.reference}).`,
      providerMessageId: res.providerMessageId,
    });
  } else if (invoice.client.whatsapp_number && whatsappConfigured()) {
    const body = `Payment received — thank you. Receipt for invoice ${ctx.reference}, ${ctx.amountLabel}, paid to ${ctx.businessName}.`;
    const res = await sendWhatsapp({ to: invoice.client.whatsapp_number, body });
    await recordMessage({
      invoice: paid,
      channel: "whatsapp",
      direction: "outbound",
      body,
      providerMessageId: res.providerMessageId,
    });
  }

  await recordMessage({
    invoice: paid,
    channel: "system",
    direction: "system",
    body: `Payment of ${ctx.amountLabel} confirmed by Stripe. Invoice closed and receipt sent.`,
  });
}

/** Run every due follow-up. Called only by the authenticated cron route. */
export async function runDueFollowUps(limit = 100): Promise<{ processed: number }> {
  const { data: due } = await supabaseAdmin
    .from("follow_up_schedules")
    .select("invoice_id, stage")
    .eq("active", true)
    .lte("next_send_at", new Date().toISOString())
    .limit(limit);

  let processed = 0;
  for (const row of due ?? []) {
    const invoice = await loadInvoice(row.invoice_id);
    if (!invoice) continue;
    if (["paid", "cancelled"].includes(invoice.status)) {
      await supabaseAdmin
        .from("follow_up_schedules")
        .update({ active: false })
        .eq("invoice_id", row.invoice_id);
      continue;
    }
    const due_date = new Date(`${invoice.due_date}T00:00:00Z`);
    if (due_date.getTime() > Date.now()) continue; // cadence starts at the due date
    if (invoice.status === "active" && daysBetween(new Date(), due_date) < 0) {
      await supabaseAdmin.from("invoices").update({ status: "overdue" }).eq("id", invoice.id);
    }
    await sendReminder(row.invoice_id, row.stage as Stage);
    processed += 1;
  }
  return { processed };
}

/** Owner-only sandbox: what Dueno would reply to a payer message. Nothing is sent or stored. */
export async function previewReply(invoiceId: string, ownerId: string, text: string) {
  const invoice = await loadInvoice(invoiceId);
  if (!invoice || invoice.user_id !== ownerId) throw new Error("Invoice not found.");
  const reply = await generatePayerReply(buildContext(invoice), text);
  await logAi({ userId: ownerId, invoiceId, kind: "test_reply", model: reply.model, blocked: reply.blocked, reason: reply.reason });
  return {
    text: reply.text,
    blocked: reply.blocked,
    paymentClaim: claimsPayment(text),
  };
}
