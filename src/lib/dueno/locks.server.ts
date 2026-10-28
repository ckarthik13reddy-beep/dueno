import { supabaseAdmin } from '@/integrations/supabase/client.server';

export async function withInvoiceLock<T>(invoiceId: string, work: () => Promise<T>): Promise<T> {
  const owner = crypto.randomUUID();
  const key = `invoice:${invoiceId}`;
  const { data, error } = await supabaseAdmin.rpc('acquire_automation_lock', { lock_key: key, lock_owner: owner });
  if (error || !data) throw new Error('This invoice is being updated. Please try again shortly.');
  try { return await work(); }
  finally { await supabaseAdmin.from('automation_locks').delete().eq('key', key).eq('owner', owner); }
}