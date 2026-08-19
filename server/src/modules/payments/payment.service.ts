import { constants } from '../../config/constants';
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/errors';
import { createCheckoutSession } from './stripe.service';

/**
 * Payment orchestration. Creates the Payment row and a Stripe Checkout
 * Session that pays the trader's connected account and captures the platform
 * application fee. Idempotent: re-calling for the same booking returns the
 * existing payment/URL instead of minting a new Stripe session.
 */
export async function createPaymentForBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true, trader: true },
  });
  if (!booking) throw ApiError.notFound('Booking not found.');

  // Idempotency: booking already has a payment.
  if (booking.payment) {
    if (booking.payment.checkoutUrl) return booking.payment;
    if (booking.payment.stripeCheckoutSessionId) return booking.payment;
  }

  if (!booking.trader.stripeAccountId || !booking.trader.stripeOnboardingDone) {
    throw ApiError.payment(
      'The trader is not connected to receive payments. Please complete Stripe onboarding.',
    );
  }

  // Platform application fee in minor units, capped at the booking fee.
  const applicationFee = Math.min(constants.APPLICATION_FEE, booking.bookingFee);

  const checkout = await createCheckoutSession({
    traderStripeAccountId: booking.trader.stripeAccountId,
    amountMinor: booking.bookingFee,
    currency: booking.currency,
    applicationFeeMinor: applicationFee,
    bookingId: booking.id,
    customerName: booking.customerName,
    customerEmail: null,
    description: `TradeSlot booking for ${booking.customerName}`,
    successUrl: `${env.CLIENT_BASE_URL}/payment/success?bookingId=${booking.id}`,
    cancelUrl: `${env.CLIENT_BASE_URL}/payment/cancel?bookingId=${booking.id}`,
  });

  return prisma.payment.upsert({
    where: { bookingId: booking.id },
    update: {
      stripeCheckoutSessionId: checkout.id,
      checkoutUrl: checkout.url ?? null,
      connectedAccountId: booking.trader.stripeAccountId ?? null,
      status: 'PENDING',
    },
    create: {
      bookingId: booking.id,
      stripeCheckoutSessionId: checkout.id,
      checkoutUrl: checkout.url ?? null,
      connectedAccountId: booking.trader.stripeAccountId ?? null,
      amount: booking.bookingFee,
      applicationFee: applicationFee,
      currency: booking.currency,
      status: 'PENDING',
    },
  });
}