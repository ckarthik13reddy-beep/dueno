// Pure helpers shared by browser and server code. No secrets, no server imports.

export type InvoiceStatus =
  | "pending"
  | "active"
  | "overdue"
  | "pending_manual_confirmation"
  | "paid"
  | "cancelled";

export const FOLLOW_UP_INTERVAL_DAYS = 3;

export function formatMoney(amountCents: number, currency = "usd"): string {
  const value = (amountCents ?? 0) / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency.toUpperCase()} ${value.toFixed(2)}`;
  }
}

export function daysBetween(from: Date, to: Date): number {
  const ms = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) -
    Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round(ms / 86_400_000);
}

/** Plain-language status for the dashboard table. */
export function statusLabel(
  status: InvoiceStatus,
  dueDate: string,
  now: Date = new Date(),
): string {
  if (status === "paid") return "Paid";
  if (status === "cancelled") return "Cancelled";
  if (status === "pending_manual_confirmation") return "Needs your confirmation";
  const due = new Date(`${dueDate}T00:00:00Z`);
  const diff = daysBetween(now, due);
  if (diff > 1) return `Due in ${diff} days`;
  if (diff === 1) return "Due tomorrow";
  if (diff === 0) return "Due today";
  if (diff === -1) return "1 day overdue";
  return `${Math.abs(diff)} days overdue`;
}

export function statusTone(
  status: InvoiceStatus,
  dueDate: string,
): "paid" | "overdue" | "attention" | "open" | "closed" {
  if (status === "paid") return "paid";
  if (status === "cancelled") return "closed";
  if (status === "pending_manual_confirmation") return "attention";
  const due = new Date(`${dueDate}T00:00:00Z`);
  return daysBetween(new Date(), due) < 0 ? "overdue" : "open";
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]{1,64}@[^\s@.]+(\.[^\s@.]+)+$/.test(value.trim());
}

/** E.164-ish check; WhatsApp requires an international number. */
export function normalizePhone(value: string): string | null {
  const cleaned = value.replace(/[^\d+]/g, "");
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return `+${digits}`;
}

export type ReceiptFields = {
  business_name: boolean;
  logo: boolean;
  invoice_ref: boolean;
  amount_paid: boolean;
  date_paid: boolean;
  payer_name: boolean;
  thank_you: string;
  contact_details: boolean;
};

export const DEFAULT_RECEIPT_FIELDS: ReceiptFields = {
  business_name: true,
  logo: false,
  invoice_ref: true,
  amount_paid: true,
  date_paid: true,
  payer_name: true,
  thank_you: "Thank you for your payment.",
  contact_details: false,
};
