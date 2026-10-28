/** Stripe Connect: payments route straight to the user's own account. */
import Stripe from "stripe";

export function stripeConfigured(): boolean {
  return Boolean(process.env["STRIPE_SECRET_KEY"]);
}

export function getStripe(): Stripe {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("Payments are not configured yet.");
  return new Stripe(key, { apiVersion: "2025-10-29.clover" as Stripe.LatestApiVersion });
}

export function appOrigin(): string {
  return (
    process.env["APP_ORIGIN"] ??
    process.env["VITE_APP_ORIGIN"] ??
    "https://project--cdd46023-20f5-40d7-b40e-6262c653c283.lovable.app"
  );
}

/** Create (once) the user's connected account and return a fresh onboarding link. */
export async function createOnboardingLink(params: {
  existingAccountId: string | null;
  email: string | null;
  businessName: string | null;
}): Promise<{ accountId: string; url: string }> {
  const stripe = getStripe();
  let accountId = params.existingAccountId;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      ...(params.email ? { email: params.email } : {}),
      ...(params.businessName ? { business_profile: { name: params.businessName } } : {}),
      capabilities: { transfers: { requested: true }, card_payments: { requested: true } },
    });
    accountId = account.id;
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${appOrigin()}/settings?stripe=refresh`,
    return_url: `${appOrigin()}/settings?stripe=return`,
  });

  return { accountId, url: link.url };
}

export async function accountReady(accountId: string): Promise<boolean> {
  const account = await getStripe().accounts.retrieve(accountId);
  return Boolean(account.charges_enabled && account.details_submitted);
}

/** One payment link per invoice, charged directly on the connected account. */
export async function createInvoicePaymentLink(params: {
  connectedAccountId: string;
  invoiceId: string;
  amountCents: number;
  currency: string;
  reference: string;
  description: string;
  businessName: string;
}): Promise<string> {
  const stripe = getStripe();
  const price = await stripe.prices.create(
    {
      currency: params.currency,
      unit_amount: params.amountCents,
      product_data: { name: `Invoice ${params.reference} — ${params.businessName}`.slice(0, 250) },
    },
    { stripeAccount: params.connectedAccountId },
  );

  const link = await stripe.paymentLinks.create(
    {
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: { dueno_invoice_id: params.invoiceId },
      payment_intent_data: { metadata: { dueno_invoice_id: params.invoiceId } },
      after_completion: {
        type: "hosted_confirmation",
        hosted_confirmation: { custom_message: "Thank you — your receipt is on its way." },
      },
    },
    { stripeAccount: params.connectedAccountId },
  );

  return link.url;
}
