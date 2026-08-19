import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { handleStripeWebhook } from '../src/modules/webhooks/stripe.webhook';
import { describeDb } from './helpers';

let captureObject: Record<string, unknown> | null = null;

vi.mock('../src/modules/payments/stripe.service', () => ({
  constructStripeWebhookEvent: vi.fn((payload: string) => {
    const object = JSON.parse(payload) as { data: { object: Record<string, unknown> } };
    captureObject = object.data.object;
    const id = String(object.data.object.id ?? 'evt_unknown');
    return {
      id: `${id}-event`,
      type: object.data.object.type ?? 'checkout.session.completed',
      data: { object: object.data.object },
    };
  }),
}));

const fakeSignature = 't=123,v1=fakesig';

await describeDb('stripe webhook integration', (getFixture) => {
  let traderId: string;

  beforeAll(() => {
    traderId = getFixture().traderId;
  });

  async function seedBooking() {
    const booking = await prisma.booking.create({
      data: {
        traderId,
        customerName: 'Webhook Customer',
        customerPhone: '15550002222',
        requestedDate: new Date('2026-10-01T00:00:00.000Z'),
        startTime: new Date('2026-10-01T10:00:00.000Z'),
        endTime: new Date('2026-10-01T11:00:00.000Z'),
        jobDurationMin: 60,
        bufferMin: 30,
        bookingFee: 5000,
        currency: 'usd',
        status: 'PAYMENT_PENDING',
      },
    });
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        stripeCheckoutSessionId: `cs_test_${booking.id}`,
        amount: 5000,
        applicationFee: 500,
        currency: 'usd',
        status: 'PENDING',
        connectedAccountId: 'acct_test',
      },
    });
    return booking;
  }

  it('marks payment succeeded and booking PAID on checkout.session.completed', async () => {
    const booking = await seedBooking();

    const payload = JSON.stringify({
      id: 'evt_checkout_completed',
      data: {
        object: {
          id: `cs_test_${booking.id}`,
          payment_intent: 'pi_test_123',
          metadata: { bookingId: booking.id },
        },
      },
    });

    const result = await handleStripeWebhook(payload, fakeSignature);
    expect(result).toEqual({ received: 'checkout.session.completed', processed: true });

    const after = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: { payment: true },
    });
    expect(after!.status).toBe('PAID');
    expect(after!.payment!.status).toBe('SUCCEEDED');
    expect(after!.payment!.stripePaymentIntentId).toBe('pi_test_123');
  });

  it('is idempotent when Stripe replays the same event', async () => {
    const booking = await seedBooking();

    const payload = JSON.stringify({
      id: 'evt_replay',
      data: {
        object: {
          id: `cs_test_${booking.id}`,
          payment_intent: 'pi_replay',
          metadata: { bookingId: booking.id },
        },
      },
    });

    const first = await handleStripeWebhook(payload, fakeSignature);
    expect(first.processed).toBe(true);

    const replay = await handleStripeWebhook(payload, fakeSignature);
    expect(replay.processed).toBe(false);

    const ledger = await prisma.webhookEvent.count({
      where: { eventId: 'evt_replay' },
    });
    expect(ledger).toBe(1);

    const payment = await prisma.payment.findUnique({ where: { bookingId: booking.id } });
    expect(payment!.status).toBe('SUCCEEDED');
  });
});