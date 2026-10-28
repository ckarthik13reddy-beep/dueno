import { createFileRoute } from "@tanstack/react-router";

// Stripe Connect webhook. Only a signature-verified event can mark an invoice paid.
export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["STRIPE_WEBHOOK_SECRET"];
        if (!secret) return new Response("Not configured", { status: 503 });
        const sig = request.headers.get("stripe-signature");
        if (!sig) return new Response("Missing signature", { status: 400 });

        const body = await request.text();
        const { getStripe } = await import("@/lib/dueno/stripe.server");
        const stripe = getStripe();
        let event;
        try {
          event = await stripe.webhooks.constructEventAsync(body, sig, secret);
        } catch {
          return new Response("Invalid signature", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        // Idempotency: event_id is unique, a replayed event is ignored.
        const { error: dup } = await supabaseAdmin.from("payment_events").insert({
          provider: "stripe",
          event_id: event.id,
          event_type: event.type,
          payload: { account: event.account ?? null },
        });
        if (dup) return new Response("ok");

        if (event.type === "payment_intent.succeeded" || event.type === "checkout.session.completed") {
          const obj = event.data.object as {
            id: string;
            metadata?: Record<string, string> | null;
            payment_intent?: string | null;
            payment_status?: string;
          };
          if (event.type === "checkout.session.completed" && obj.payment_status !== "paid") return new Response("ok");
          const invoiceId = obj.metadata?.["dueno_invoice_id"];
          if (!invoiceId || !/^[0-9a-f-]{36}$/.test(invoiceId)) return new Response("ok");

          // The event must come from the connected account that owns this invoice.
          const { data: inv } = await supabaseAdmin
            .from("invoices")
            .select("id, user_id")
            .eq("id", invoiceId)
            .maybeSingle();
          if (!inv) return new Response("ok");
          const { data: owner } = await supabaseAdmin
            .from("profiles")
            .select("stripe_account_id")
            .eq("user_id", inv.user_id)
            .maybeSingle();
          if (!owner?.stripe_account_id || owner.stripe_account_id !== event.account) {
            return new Response("ok");
          }

          await supabaseAdmin.from("payment_events").update({ invoice_id: inv.id, user_id: inv.user_id }).eq("event_id", event.id);
          const pi = event.type === "payment_intent.succeeded" ? obj.id : (obj.payment_intent ?? null);
          const { markInvoicePaid } = await import("@/lib/dueno/engine.server");
          await markInvoicePaid(inv.id, pi);
        }
        return new Response("ok");
      },
    },
  },
});
