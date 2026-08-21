import Stripe from 'stripe';
import { AppError } from '../../utils/errors';
import { env } from '../../config/env';
import { getStripe } from '../../lib/stripe';

/**
 * Stripe Connect operations. Kept behind a service so controllers and the
 * webhook handler never talk to the Stripe SDK directly (AGENT.md §10, §18).
 */

export async function createConnectOnboardingLink(traderId: string, trader: {
  stripeAccountId: string | null;
  name: string;
  email: string | null;
}) {
  const stripe = getStripe();

  let accountId = trader.stripeAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email: trader.email ?? undefined,
      metadata: { traderId },
    });
    accountId = account.id;
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${env.API_BASE_URL}/api/stripe/connect/status?traderId=${traderId}`,
    return_url: `${env.API_BASE_URL}/api/stripe/connect/status?traderId=${traderId}`,
    type: 'account_onboarding',
  });

  return { accountId, url: link.url };
}

export async function getConnectAccountStatus(accountId: string) {
  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(accountId);
  const details = account.details_submitted ?? false;
  const charges = account.charges_enabled ?? false;
  const payouts = account.payouts_enabled ?? false;
  return {
    id: account.id,
    detailsSubmitted: details,
    chargesEnabled: charges,
    payoutsEnabled: payouts,
    onboardingComplete: details && charges && payouts,
  };
}

export async function createCheckoutSession(params: {
  traderStripeAccountId: string;
  amountMinor: number;
  currency: string;
  applicationFeeMinor: number;
  bookingId: string;
  customerName: string;
  customerEmail?: string | null;
  description?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripe();

  return stripe.checkout.sessions.create({
    mode: 'payment',
    payment_intent_data: {
      application_fee_amount: params.applicationFeeMinor,
      transfer_data: { destination: params.traderStripeAccountId },
      description: params.description,
      metadata: { bookingId: params.bookingId },
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: params.currency,
          unit_amount: params.amountMinor,
          product_data: { name: params.description ?? 'TradeSlot booking' },
        },
      },
    ],
    customer_email: params.customerEmail ?? undefined,
    metadata: { bookingId: params.bookingId },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });
}

export function constructStripeWebhookEvent(payload: string, signature: string) {
  const stripe = getStripe();
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw AppError.internal('STRIPE_WEBHOOK_SECRET is not configured.');
  }
  return stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
}