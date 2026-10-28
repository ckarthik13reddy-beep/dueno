/** Outbound delivery. DuenoPay is the sender on every channel. */

export type SendResult = {
  delivered: boolean;
  providerMessageId: string | null;
  error?: string;
};

export function emailConfigured(): boolean {
  return Boolean(process.env["RESEND_API_KEY"] && process.env["DUENO_EMAIL_FROM"]);
}

export function whatsappConfigured(): boolean {
  return Boolean(
    process.env["TWILIO_ACCOUNT_SID"] &&
      process.env["TWILIO_AUTH_TOKEN"] &&
      process.env["TWILIO_WHATSAPP_FROM"],
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function textToHtml(text: string): string {
  return escapeHtml(text)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px;line-height:1.6">${p.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  attachment?: { filename: string; contentBase64: string } | null;
}): Promise<SendResult> {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["DUENO_EMAIL_FROM"];
  if (!apiKey || !from) {
    return { delivered: false, providerMessageId: null, error: "email_not_configured" };
  }

  const body: Record<string, unknown> = {
    from: `DuenoPay <${from}>`,
    to: [params.to],
    subject: params.subject.slice(0, 200),
    html: params.html,
  };
  if (params.attachment) {
    body["attachments"] = [
      { filename: params.attachment.filename, content: params.attachment.contentBase64 },
    ];
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return {
      delivered: false,
      providerMessageId: null,
      error: `email_${res.status}`,
    };
  }
  const json = (await res.json().catch(() => ({}))) as { id?: string };
  return { delivered: true, providerMessageId: json.id ?? null };
}

export async function sendWhatsapp(params: {
  to: string;
  body: string;
  mediaUrl?: string | null;
}): Promise<SendResult> {
  const sid = process.env["TWILIO_ACCOUNT_SID"];
  const token = process.env["TWILIO_AUTH_TOKEN"];
  const from = process.env["TWILIO_WHATSAPP_FROM"];
  if (!sid || !token || !from) {
    return { delivered: false, providerMessageId: null, error: "whatsapp_not_configured" };
  }

  const form = new URLSearchParams({
    From: `whatsapp:${from.replace(/^whatsapp:/, "")}`,
    To: `whatsapp:${params.to}`,
    Body: params.body.slice(0, 1500),
  });
  if (params.mediaUrl) form.set("MediaUrl", params.mediaUrl);

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  if (!res.ok) {
    return { delivered: false, providerMessageId: null, error: `whatsapp_${res.status}` };
  }
  const json = (await res.json().catch(() => ({}))) as { sid?: string };
  return { delivered: true, providerMessageId: json.sid ?? null };
}
