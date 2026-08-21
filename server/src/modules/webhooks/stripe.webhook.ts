import Stripe from 'stripe';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errors';
import { constructStripeWebhookEvent } from '../payments/stripe.service';

/**
 * Stripe webhook handling, separated from normal API controllers and wired to
 * a raw-body route so signature verification works (AGENT.md §10). All events
 * go through the WebhookEvent idempotency ledger so Stripe retries are no-ops.
 */

async function recordWebhookEvent(
  provider: string,
  eventId: string,
  type: string,
): Promise<{ id: string; alreadyProcessed: boolean }> {
  const event = await prisma.webhookEvent.upsert({
    where: { provider_eventId: { provider, eventId } },
    update: {},
    create: { provider, eventId, type },
  });

  return {
    id: event.id,
    alreadyProcessed: event.processedAt !== null,
  };
}

async function markProcessed(eventId: string, error?: string) {
  await prisma.webhookEvent.update({
    where: { id: eventId },
    data: { processedAt: new Date(), error },
  });
}

export async function handleStripeWebhook(rawBody: string, signature: string): Promise<{
  received: string;
  processed: boolean;
}> {
  const event = constructStripeWebhookEvent(rawBody, signature);

  const ledger = await recordWebhookEvent('stripe', event.id, event.type);
  if (ledger.alreadyProcessed) {
    return { received: event.type, processed: false };
  }

  try {
    await dispatchStripeEvent(event);
    await markProcessed(ledger.id);
    return { received: event.type, processed: true };
  } catch (err) {
    await markProcessed(ledger.id, err instanceof Error ? err.message : String(err));
    throw err;
  }
}

async function dispatchStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as {
        id?: string;
        payment_intent?: string | null;
        metadata?: Record<string, string> | null;
      };
      await handleCheckoutCompleted(session);
      return;
    }
    case 'payment_intent.succeeded': {
      const intent = event.data.object as { id?: string };
      if (intent.id) {
        await prisma.payment.updateMany({
          where: { stripePaymentIntentId: intent.id },
          data: { status: PaymentStatus.SUCCEEDED, paidAt: new Date() },
        });
      }
      return;
    }
    case 'checkout.session.expired':
    case 'payment_intent.canceled':
    case 'payment_intent.payment_failed': {
      const object = event.data.object as { id?: string; metadata?: Record<string, string> | null };
      const bookingId = object.metadata?.bookingId;
      if (bookingId) {
        const payment = await prisma.payment.findFirst({ where: { bookingId } });
        if (payment) {
          const nextStatus = event.type === 'checkout.session.expired'
            ? PaymentStatus.CANCELLED
            : PaymentStatus.FAILED;
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: nextStatus },
          });
        }
      }
      return;
    }
    default:
      // Unhandled event types are acknowledged (recorded) but do nothing.
      return;
  }
}

async function handleCheckoutCompleted(session: {
  id?: string;
  payment_intent?: string | null;
  metadata?: Record<string, string> | null;
}) {
  const payment = await prisma.payment.findFirst({
    where: { stripeCheckoutSessionId: session.id },
  });
  if (!payment) throw AppError.notFound('No payment record for this checkout session.');

  const paymentIntentId = session.payment_intent ?? undefined;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.SUCCEEDED,
        paidAt: new Date(),
        stripePaymentIntentId: paymentIntentId,
      },
    });

    const booking = await tx.booking.findUnique({ where: { id: payment.bookingId } });
    if (!booking) throw AppError.notFound('Booking for payment not found.');

    if (booking.status === BookingStatus.CANCELLED) {
      throw AppError.invalidState('Cannot mark a cancelled booking as PAID.');
    }

    await tx.booking.update({
      where: { id: payment.bookingId },
      data: { status: BookingStatus.PAID },
    });
  });
}