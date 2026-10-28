import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "crypto";

// Runs the 3-day follow-up cadence. Caller must present the scheduler token whose
// SHA-256 hash is stored server-side (never readable by app users).
export const Route = createFileRoute("/api/public/cron-followups")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = /^Bearer ([A-Za-z0-9]{32,128})$/.exec(request.headers.get("authorization") ?? "")?.[1];
        if (!token) return new Response("Unauthorized", { status: 401 });
        const hash = createHash("sha256").update(token).digest("hex");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin.from("cron_tokens").select("id").eq("token_hash", hash).maybeSingle();
        if (!data) return new Response("Unauthorized", { status: 401 });

        const { runDueFollowUps } = await import("@/lib/dueno/engine.server");
        const result = await runDueFollowUps(100);
        return Response.json(result);
      },
    },
  },
});
