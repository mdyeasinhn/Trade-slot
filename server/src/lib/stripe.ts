import Stripe from 'stripe';
import { env } from '../config/env';

let cached: Stripe | null = null;

/**
 * Lazily-instantiated Stripe client. Constructing with a missing key throws,
 * so we only build it when a payment/connect/webhook flow actually needs it.
 * This lets the server boot in dev without Stripe credentials configured.
 */
export function getStripe(): Stripe {
  if (!cached) {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured.');
    }
    cached = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return cached;
}

export type StripeClient = Stripe;