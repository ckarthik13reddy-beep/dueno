import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

// Twilio WhatsApp inbound webhook. Every request must carry a valid Twilio signature.
export const Route = createFileRoute("/api/public/whatsapp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env["TWILIO_AUTH_TOKEN"];
        if (!token) return new Response("Not configured", { status: 503 });

        const raw = await request.text();
        if (raw.length > 20_000) return new Response("Too large", { status: 413 });
        const params = new URLSearchParams(raw);

        const { appOrigin } = await import("@/lib/dueno/stripe.server");
        const url = `${appOrigin()}/api/public/whatsapp`;
        const signed =
          url +
          [...params.keys()]
            .sort()
            .map((k) => k + (params.get(k) ?? ""))
            .join("");
        const expected = Buffer.from(createHmac("sha1", token).update(signed).digest("base64"));
        const given = Buffer.from(request.headers.get("x-twilio-signature") ?? "");
        if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
          return new Response("Invalid signature", { status: 401 });
        }

        const from = (params.get("From") ?? "").replace(/^whatsapp:/, "");
        const text = (params.get("Body") ?? "").slice(0, 4000);
        const sid = params.get("MessageSid");
        const { normalizePhone } = await import("@/lib/dueno/shared");
        const phone = normalizePhone(from);
        if (!phone || !text.trim()) return twiml();

        const { checkRateLimit } = await import("@/lib/dueno/ratelimit.server");
        if (!(await checkRateLimit({ subject: phone, action: "inbound_wa", limit: 30, windowSeconds: 3600 }))) {
          return twiml();
        }

        const { handleInboundReply } = await import("@/lib/dueno/engine.server");
        await handleInboundReply({ channel: "whatsapp", fromContact: phone, text, providerMessageId: sid });
        return twiml();
      },
    },
  },
});

function twiml() {
  return new Response("<Response></Response>", { headers: { "Content-Type": "text/xml" } });
}
