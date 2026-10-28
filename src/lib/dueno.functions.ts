import type { Database, Json } from "@/integrations/supabase/types";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { isValidEmail, normalizePhone } from "./dueno/shared";

/* ------------------------------------------------------------------ *
 * Validation schemas. Every input is parsed before it touches the DB. *
 * ------------------------------------------------------------------ */

const nameSchema = z.string().trim().min(1).max(200);
const emailSchema = z.string().trim().max(254).refine(isValidEmail, "Invalid email");
const phoneSchema = z
  .string()
  .trim()
  .max(30)
  .transform((v) => normalizePhone(v))
  .refine((v): v is string => v !== null, "Invalid phone number");

const invoiceInput = z
  .object({
    name: nameSchema,
    email: z.string().trim().max(254).optional().or(z.literal("")),
    whatsapp: z.string().trim().max(30).optional().or(z.literal("")),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    amount: z.number().positive().max(100_000_000),
    currency: z
      .string()
      .trim()
      .length(3)
      .transform((v) => v.toLowerCase())
      .default("usd"),
    description: z.string().trim().max(500).optional().default(""),
    reference: z.string().trim().max(60).optional().default(""),
    filePath: z.string().trim().max(400).optional().or(z.literal("")),
    source: z.enum(["manual", "excel_upload"]).default("manual"),
  })
  .superRefine((value, ctx) => {
    const hasEmail = value.email && isValidEmail(value.email);
    const hasPhone = value.whatsapp && normalizePhone(value.whatsapp);
    if (!hasEmail && !hasPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A WhatsApp number or an email address is required",
      });
    }
  });

export type InvoiceInput = z.input<typeof invoiceInput>;

const uuid = z.string().uuid();

/* ------------------------------------------------------------ *
 * Reads. RLS scopes every row to the signed-in user by user_id. *
 * ------------------------------------------------------------ */

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [profileRes, invoiceRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("invoices")
        .select(
          "id, reference, amount_cents, currency, description, due_date, status, source, payment_link_url, file_path, created_at, client:clients!inner(id, name, email, whatsapp_number)",
        )
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    return {
      profile: profileRes.data ?? null,
      invoices: invoiceRes.data ?? [],
      integrations: {
        payments: Boolean(process.env["STRIPE_SECRET_KEY"]),
        email: Boolean(process.env["RESEND_API_KEY"] && process.env["DUENO_EMAIL_FROM"]),
        whatsapp: Boolean(
          process.env["TWILIO_ACCOUNT_SID"] &&
            process.env["TWILIO_AUTH_TOKEN"] &&
            process.env["TWILIO_WHATSAPP_FROM"],
        ),
      },
    };
  });

export const getThread = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: { invoiceId: string }) => z.object({ invoiceId: uuid }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    // RLS restricts this to the caller's own invoice; a foreign id returns null.
    const { data: invoice } = await supabase
      .from("invoices")
      .select(
        "id, reference, amount_cents, currency, description, due_date, status, source, payment_link_url, file_path, created_at, paid_at, client:clients!inner(id, name, email, whatsapp_number)",
      )
      .eq("id", data.invoiceId)
      .maybeSingle();

    if (!invoice) return { invoice: null, messages: [], aiEvents: [] };

    const { data: messages } = await supabase
      .from("messages")
      .select("id, channel, direction, body, template_key, attachment_path, created_at")
      .eq("invoice_id", data.invoiceId)
      .order("created_at", { ascending: true })
      .limit(500);

    const { data: aiEvents } = await supabase
      .from("ai_events")
      .select("id, kind, blocked, block_reason, created_at")
      .eq("invoice_id", data.invoiceId)
      .order("created_at", { ascending: false })
      .limit(50);

    return { invoice, messages: messages ?? [], aiEvents: aiEvents ?? [] };
  });

/* ---------------- Profile / settings ---------------- */

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        businessName: z.string().trim().max(200).optional(),
        contactDetails: z.string().trim().max(500).optional(),
        digestEnabled: z.boolean().optional(),
        receiptFields: z
          .object({
            business_name: z.boolean(),
            logo: z.boolean(),
            invoice_ref: z.boolean(),
            amount_paid: z.boolean(),
            date_paid: z.boolean(),
            payer_name: z.boolean(),
            thank_you: z.string().trim().max(300),
            contact_details: z.boolean(),
          })
          .optional(),
        receiptTemplateComplete: z.boolean().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const patch: Database["public"]["Tables"]["profiles"]["Update"] = {};
    if (data.businessName !== undefined) patch["business_name"] = data.businessName;
    if (data.contactDetails !== undefined) patch["contact_details"] = data.contactDetails;
    if (data.digestEnabled !== undefined) patch["digest_enabled"] = data.digestEnabled;
    if (data.receiptFields) patch["receipt_fields"] = data.receiptFields as Json;
    if (data.receiptTemplateComplete !== undefined) {
      patch["receipt_template_complete"] = data.receiptTemplateComplete;
    }

    const { error } = await context.supabase
      .from("profiles")
      .update(patch)
      .eq("user_id", context.userId);
    if (error) throw new Error("Could not save your settings.");
    return { ok: true };
  });

/* ---------------- Stripe Connect ---------------- */

export const startStripeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { createOnboardingLink, stripeConfigured } = await import("./dueno/stripe.server");
    if (!stripeConfigured()) {
      return { url: null as string | null, reason: "not_configured" as const };
    }

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("stripe_account_id, business_name, email")
      .eq("user_id", context.userId)
      .maybeSingle();

    const { accountId, url } = await createOnboardingLink({
      existingAccountId: profile?.stripe_account_id ?? null,
      email: profile?.email ?? null,
      businessName: profile?.business_name ?? null,
    });

    // stripe_account_id is server-owned (client writes to it are stripped by a trigger).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("profiles")
      .update({ stripe_account_id: accountId })
      .eq("user_id", context.userId);

    return { url, reason: null };
  });

export const refreshStripeStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { accountReady, stripeConfigured } = await import("./dueno/stripe.server");
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("stripe_account_id, stripe_onboarding_complete")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!stripeConfigured() || !profile?.stripe_account_id) {
      return { ready: false };
    }

    const ready = await accountReady(profile.stripe_account_id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("profiles")
      .update({ stripe_onboarding_complete: ready })
      .eq("user_id", context.userId);
    return { ready };
  });

/* ---------------- Invoice document reading ---------------- */

export const readInvoiceFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: { filePath: string }) =>
    z.object({ filePath: z.string().trim().min(3).max(400) }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    // Path traversal / cross-tenant guard: the file must sit in the caller's folder.
    if (!data.filePath.startsWith(`${context.userId}/`) || data.filePath.includes("..")) {
      throw new Error("Forbidden");
    }

    const { checkRateLimit } = await import("./dueno/ratelimit.server");
    const allowed = await checkRateLimit({
      subject: context.userId,
      action: "extract",
      limit: 40,
      windowSeconds: 3600,
    });
    if (!allowed) throw new Error("Too many uploads in a short time. Please try again later.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: file } = await supabaseAdmin.storage.from("invoice-files").download(data.filePath);
    if (!file) throw new Error("That file could not be read.");
    if (file.size > 12 * 1024 * 1024) throw new Error("That file is too large to read.");

    const buffer = Buffer.from(await file.arrayBuffer());
    const { extractInvoiceFromFile } = await import("./dueno/ai.server");
    const extracted = await extractInvoiceFromFile(
      buffer.toString("base64"),
      file.type || "application/pdf",
      data.filePath.split("/").pop() ?? "invoice",
    );
    return extracted;
  });

/* ---------------- Creating invoices ---------------- */

async function createOne(
  supabase: typeof import("@/integrations/supabase/client")["supabase"],
  userId: string,
  input: z.output<typeof invoiceInput>,
) {
  const email = input.email && isValidEmail(input.email) ? input.email.trim() : null;
  const whatsapp = input.whatsapp ? normalizePhone(input.whatsapp) : null;

  // Reuse an existing client of THIS user when the contact matches.
  let clientId: string | null = null;
  const matchColumn = whatsapp ? "whatsapp_number" : "email";
  const matchValue = whatsapp ?? email;
  if (matchValue) {
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", userId)
      .eq(matchColumn, matchValue)
      .maybeSingle();
    clientId = existing?.id ?? null;
  }

  if (!clientId) {
    const { data: created, error } = await supabase
      .from("clients")
      .insert({ user_id: userId, name: input.name, email, whatsapp_number: whatsapp })
      .select("id")
      .single();
    if (error || !created) throw new Error("Could not save this payer.");
    clientId = created.id;
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      user_id: userId,
      client_id: clientId,
      reference: input.reference || null,
      amount_cents: Math.round(input.amount * 100),
      currency: input.currency,
      description: input.description || null,
      due_date: input.dueDate,
      source: input.source,
      file_path: input.filePath || null,
      preferred_channel: whatsapp ? "whatsapp" : "email",
      status: "pending",
    })
    .select("id")
    .single();

  if (invoiceError || !invoice) {
    console.error("[createInvoice] insert failed", invoiceError?.code, invoiceError?.message);
    throw new Error("Could not save this invoice.");
  }
  return invoice.id;
}

export const createInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => invoiceInput.parse(raw))
  .handler(async ({ data, context }) => {
    const { checkRateLimit } = await import("./dueno/ratelimit.server");
    const allowed = await checkRateLimit({
      subject: context.userId,
      action: "create_invoice",
      limit: 200,
      windowSeconds: 3600,
    });
    if (!allowed) throw new Error("Too many invoices created in a short time.");

    if (data.filePath && !data.filePath.startsWith(`${context.userId}/`)) {
      throw new Error("Forbidden");
    }

    const invoiceId = await createOne(context.supabase, context.userId, data);
    const { startInvoiceConversation } = await import("./dueno/engine.server");
    await startInvoiceConversation(invoiceId);
    return { invoiceId };
  });

export const createInvoicesBulk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ rows: z.array(invoiceInput).min(1).max(200) }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { checkRateLimit } = await import("./dueno/ratelimit.server");
    const allowed = await checkRateLimit({
      subject: context.userId,
      action: "bulk_upload",
      limit: 10,
      windowSeconds: 3600,
    });
    if (!allowed) throw new Error("Too many bulk uploads in a short time.");

    const { startInvoiceConversation } = await import("./dueno/engine.server");
    const created: string[] = [];
    const failed: number[] = [];

    for (const [index, row] of data.rows.entries()) {
      try {
        const id = await createOne(context.supabase, context.userId, {
          ...row,
          source: "excel_upload",
        });
        created.push(id);
      } catch {
        failed.push(index);
      }
    }

    for (const id of created) await startInvoiceConversation(id);
    return { created: created.length, failed };
  });

/* ---------------- Invoice actions ---------------- */

export const cancelInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: { invoiceId: string }) => z.object({ invoiceId: uuid }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("invoices")
      .update({ status: "cancelled" })
      .eq("id", data.invoiceId);
    if (error) throw new Error("Could not cancel that invoice.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("follow_up_schedules")
      .update({ active: false })
      .eq("invoice_id", data.invoiceId)
      .eq("user_id", context.userId);
    return { ok: true };
  });

/** The user (never the AI, never the payer) confirms an off-Stripe payment. */
export const confirmPaymentManually = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: { invoiceId: string }) => z.object({ invoiceId: uuid }).parse(raw))
  .handler(async ({ data, context }) => {
    const { data: invoice } = await context.supabase
      .from("invoices")
      .select("id")
      .eq("id", data.invoiceId)
      .maybeSingle();
    if (!invoice) throw new Error("Invoice not found.");

    const { markInvoicePaid } = await import("./dueno/engine.server");
    await markInvoicePaid(data.invoiceId, null);
    return { ok: true };
  });

/* ---------------- AI agent: owner tools ---------------- */

/** Owner types a pretend payer message and sees exactly what Dueno would answer. */
export const testPayerReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: { invoiceId: string; text: string }) =>
    z.object({ invoiceId: uuid, text: z.string().trim().min(1).max(1000) }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    // RLS check first: a foreign invoice id returns nothing.
    const { data: own } = await context.supabase.from("invoices").select("id").eq("id", data.invoiceId).maybeSingle();
    if (!own) throw new Error("Invoice not found.");
    const { checkRateLimit } = await import("./dueno/ratelimit.server");
    if (!(await checkRateLimit({ subject: context.userId, action: "test_reply", limit: 30, windowSeconds: 3600 }))) {
      throw new Error("Too many tests in a short time. Try again later.");
    }
    const { previewReply } = await import("./dueno/engine.server");
    return previewReply(data.invoiceId, context.userId, data.text);
  });

/** Send (or draft, if sending isn't connected) the next reminder right now. */
export const sendReminderNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: { invoiceId: string }) => z.object({ invoiceId: uuid }).parse(raw))
  .handler(async ({ data, context }) => {
    const { data: own } = await context.supabase.from("invoices").select("id, status").eq("id", data.invoiceId).maybeSingle();
    if (!own) throw new Error("Invoice not found.");
    if (own.status === "paid" || own.status === "cancelled") throw new Error("This invoice is closed.");
    const { checkRateLimit } = await import("./dueno/ratelimit.server");
    if (!(await checkRateLimit({ subject: data.invoiceId, action: "manual_nudge", limit: 3, windowSeconds: 86400 }))) {
      throw new Error("You can nudge a payer at most 3 times a day.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sched } = await supabaseAdmin.from("follow_up_schedules").select("stage").eq("invoice_id", data.invoiceId).maybeSingle();
    const { sendReminder } = await import("./dueno/engine.server");
    const result = await sendReminder(data.invoiceId, (sched?.stage ?? "first") as "first");
    return { result };
  });
