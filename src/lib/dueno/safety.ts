export function ownedFilePath(path: string, userId: string): boolean {
  return path.startsWith(`${userId}/`) && !path.includes('..');
}

export function paymentMatches(invoice: { amount_cents: number; currency: string }, payment: { amount_received?: number; amount_total?: number | null; currency?: string | null }): boolean {
  return (payment.amount_received ?? payment.amount_total) === invoice.amount_cents && payment.currency?.toLowerCase() === invoice.currency.toLowerCase();
}

export function unambiguousInvoice<T extends { id: string }>(candidates: T[]): T | null {
  return candidates.length === 1 ? candidates[0] ?? null : null;
}

export function validInvoiceDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}