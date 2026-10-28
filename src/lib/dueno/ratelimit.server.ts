import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Fixed-window rate limit backed by the database, so it holds across all
 * server instances. Used to cap expensive/abusable actions per user.
 */
export async function checkRateLimit(params: {
  subject: string;
  action: string;
  limit: number;
  windowSeconds: number;
}): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc('consume_rate_limit', {
    p_subject: params.subject, p_action: params.action,
    p_limit: params.limit, p_window_seconds: params.windowSeconds,
  });
  if (error) throw new Error('Could not check the request limit. Please try later.');
  return data === true;
}
