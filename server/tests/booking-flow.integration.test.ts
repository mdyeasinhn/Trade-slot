import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { describeDb } from './helpers';

vi.mock('../src/modules/payments/stripe.service', () => ({
  createCheckoutSession: vi.fn(async () => ({
    id: 'cs_test_session',
    url: 'https://checkout.stripe.com/test/session',
  })),
  getConnectAccountStatus: vi.fn(async () => ({
    detailsSubmitted: true,
    chargesEnabled: true,
    payoutsEnabled: true,
    onboardingComplete: true,
  })),
}));

const app = createApp();

async function chat(traderId: string, senderId: string, message: string) {
  const res = await request(app)
    .post('/api/chat/message')
    .send({ traderId, senderId, message })
    .expect(200);
  expect(res.body.success).toBe(true);
  return res.body.data.text as string;
}

await describeDb('booking flow integration', (getFixture) => {
  let traderId: string;
  let businessId: string;

  beforeAll(() => {
    const fx = getFixture();
    traderId = fx.traderId;
    businessId = fx.businessId;
  });

  it('sets and reads a daily work area', async () => {
    const res = await request(app)
      .post(`/api/traders/${traderId}/work-area`)
      .send({ date: '2026-09-01', area: 'Harbour District' })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.area).toBe('Harbour District');

    const read = await request(app)
      .get(`/api/traders/${traderId}/work-area?date=2026-09-01`)
      .expect(200);
    expect(read.body.data.area).toBe('Harbour District');
  });

  it('returns available slots through the shared availability endpoint', async () => {
    const res = await request(app)
      .get(`/api/bookings/availability?traderId=${traderId}&date=2026-09-01`)
      .expect(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].startTimeLocal).toBe('09:00');
  });

  it('books a slot via the Web Chat flow end-to-end', async () => {
    const first = await chat(traderId, 'web-sender-1', 'I want a booking tomorrow at 10am');
    expect(first).toMatch(/10:00 is free|free|confirm/i);

    const confirm = await chat(traderId, 'web-sender-1', 'confirm');
    expect(confirm).toMatch(/Booking confirmed|Complete your payment/i);
    expect(confirm).toContain('https://checkout.stripe.com');

    const booking = await prisma.booking.findFirst({
      where: { conversation: { traderId, senderId: 'web-sender-1' } },
    });
    expect(booking).not.toBeNull();
    expect(booking!.status).toBe('PAYMENT_PENDING');
    expect(booking!.payment).not.toBeNull();
  });

  it('honours the travel buffer between jobs', async () => {
    // The 10:00 booking occupies [10:00, 11:30] (60m job + 30m buffer), so
    // 11:00 must be rejected, while 12:00 is free.
    const rej = await chat(traderId, 'web-sender-b', 'I want a booking tomorrow at 11am');
    expect(rej).toMatch(/not available|isn.t available|free slots/i);

    const ok = await chat(traderId, 'web-sender-c', 'I want a booking tomorrow at 12pm');
    expect(ok).toMatch(/12:00 is free/i);
    await chat(traderId, 'web-sender-c', 'confirm');

    const booking = await prisma.booking.findFirst({
      where: { conversation: { traderId, senderId: 'web-sender-c' } },
    });
    expect(booking).not.toBeNull();
    expect(booking!.startTime.toISOString()).toContain('T12:00:00.000Z');
  });

  it('routes WhatsApp inbound messages into the same shared engine', async () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: { phone_number_id: 'test-phone-id' },
                messages: [
                  {
                    from: '15550001111',
                    id: 'wamid-test-msg-1',
                    type: 'text',
                    text: { body: 'I want a booking tomorrow at 10am' },
                    timestamp: String(Math.floor(Date.now() / 1000)),
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const res = await request(app)
      .post('/api/webhooks/whatsapp')
      .send(payload)
      .expect(200);

    expect(res.body.success).toBe(true);

    const conversation = await prisma.conversation.findUnique({
      where: {
        traderId_channel_senderId: {
          traderId,
          channel: 'WHATSAPP',
          senderId: '15550001111',
        },
      },
    });
    expect(conversation).not.toBeNull();

    const inbound = await prisma.message.findMany({
      where: { conversationId: conversation!.id, direction: 'INBOUND' },
    });
    expect(inbound.length).toBeGreaterThan(0);

    const outbound = await prisma.message.findMany({
      where: { conversationId: conversation!.id, direction: 'OUTBOUND' },
    });
    expect(outbound.length).toBeGreaterThan(0);
  });

  it('prevents concurrent double-booking of the same slot', async () => {
    const makeActor = (i: number) => ({
      senderId: `concurrent-${Date.now()}-${i}`,
      async book() {
        const first = await chat(traderId, this.senderId, 'I want a booking tomorrow at 2pm');
        expect(first).toMatch(/2:00 is free/i);
        const confirm = await chat(traderId, this.senderId, 'confirm');
        return confirm;
      },
    });

    const texts = await Promise.all(Array.from({ length: 5 }, (_, i) => makeActor(i).book()));

    const confirmed = texts.filter((t) => /Booking confirmed/i.test(t)).length;
    expect(confirmed).toBe(1);

    const booked = await prisma.booking.count({
      where: { traderId, customerPhone: { startsWith: 'concurrent-' } },
    });
    expect(booked).toBe(1);
  });
});