import { BookingStatus } from '@prisma/client';
import { formatDateInTz } from '../../utils/date';
import { prisma } from '../../lib/prisma';
import { ChatReply, MessageChannel } from '../messaging/types';
import { ChatEngine } from '../messaging/message-normalizer';
import { createBooking, updateBookingStatus } from './booking.service';
import { getTraderWorkRules, listAvailableSlots } from './scheduling.service';
import { createPaymentForBooking } from '../payments/payment.service';
import { getTraderOrThrow } from '../traders/trader.service';

/**
 * The shared booking engine (AGENT.md §2, §8, §9). Channel-neutral: Web Chat
 * and WhatsApp both funnel here via processIncomingMessage. Holds the
 * conversation slot-filling state on the Conversation row.
 */

export interface BookingEngineState {
  step:
    | 'idle'
    | 'collect_date'
    | 'collect_time'
    | 'offer_slots'
    | 'awaiting_payment'
    | 'complete';
  date?: string;
  startTime?: string;
  offeredSlots?: string[];
  customerName?: string;
  customerPhone?: string;
  serviceDescription?: string;
  bookingId?: string;
}

export interface BookingEngineDeps {
  getOrCreateConversation: (
    traderId: string,
    channel: MessageChannel,
    senderId: string,
  ) => Promise<{ id: string }>;
  readState: (conversationId: string) => Promise<BookingEngineState>;
  writeState: (conversationId: string, state: BookingEngineState) => Promise<void>;
}

export interface BookingEngineChat extends ChatEngine {
  offerDateAndTime(
    date: string,
    time: string | null,
    traderId: string,
    timeZone: string,
    conversationId: string,
    deps: BookingEngineDeps,
  ): Promise<ChatReply>;
  confirmAndCreatePayment(
    traderId: string,
    senderId: string,
    conversationId: string,
    date: string,
    startTime: string,
    deps: BookingEngineDeps,
  ): Promise<ChatReply>;
}

const TIME_RE = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i;
const MERIDIEM_RE = /\b(am|pm)\b/i;
const NO_RE = /^(no|nope|cancel|never mind|stop)\b/i;

export function parseDateWord(content: string, timeZone: string): string | null {
  const today = formatDateInTz(new Date(), timeZone);

  if (/\btoday\b/i.test(content)) return today;

  if (/\b(day\s+after\s+)?tomorrow\b/i.test(content)) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + (/\bday\s+after\s+tomorrow\b/i.test(content) ? 2 : 1));
    return formatDateInTz(d, timeZone);
  }

  const daysFromNow = /^\s*(\d+)\s*days?\s+from\s+now/i.exec(content);
  if (daysFromNow) {
    const days = Number(daysFromNow[1]);
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + days);
    return formatDateInTz(d, timeZone);
  }

  const m = /^\s*(\d{4})-(\d{2})-(\d{2})/.exec(content);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  const weekdayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const wd = weekdayNames.findIndex((name) => new RegExp(`\\b${name}\\b`, 'i').test(content));
  if (wd >= 0) {
    const d = new Date();
    const daysUntil = (wd - d.getUTCDay() + 7) % 7 || 7;
    d.setUTCDate(d.getUTCDate() + daysUntil);
    return formatDateInTz(d, timeZone);
  }

  return null;
}

export function normalizeTime(content: string): string | null {
  const trimmed = content.trim();
  const m = TIME_RE.exec(trimmed);
  if (!m) return null;
  let hour = Number(m[1]);
  let minute = m[2] ? Number(m[2]) : 0;
  const meridiem = m[3]?.toLowerCase();

  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    if (meridiem === 'pm' && hour !== 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
  }
  if (hour > 23 || minute > 59) return null;

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function hasTime(content: string): boolean {
  return TIME_RE.test(content.trim()) || MERIDIEM_RE.test(content);
}

function findBooking(traderId: string, conversationId: string) {
  return prisma.booking.findFirst({
    where: { conversationId, traderId },
    include: { payment: true },
    orderBy: { createdAt: 'desc' },
  });
}

export function createBookingEngine(deps: BookingEngineDeps): BookingEngineChat {
  const engine: BookingEngineChat = {
    async offerDateAndTime(date, time, traderId, timeZone, conversationId) {
      const slots = await listAvailableSlots(traderId, date);

      if (time) {
        const exact = slots.find((s) => s.startTimeLocal === time);
        if (exact) {
          await deps.writeState(conversationId, {
            step: 'offer_slots',
            date,
            startTime: time,
            offeredSlots: [time],
          });
          return {
            text: `${date} at ${time} is free. Reply "confirm" (or "1") to book it.`,
            actions: slots.slice(0, 5).map((s) => ({
              type: 'slot_choice' as const,
              label: `${s.startTimeLocal}–${s.endTimeLocal}`,
              slot: s.startTimeLocal,
            })),
          };
        }
      }

      if (slots.length === 0) {
        await deps.writeState(conversationId, { step: 'collect_date' });
        return {
          text: `I\'m sorry, there are no free slots on ${date}. Would you like another day?`,
        };
      }

      const offered = slots.slice(0, 5).map((s) => s.startTimeLocal);
      await deps.writeState(conversationId, {
        step: 'offer_slots',
        date,
        ...(time ? { startTime: time } : {}),
        offeredSlots: offered,
      });

      if (time) {
        return {
          text: `That time isn\'t available. Here are the next free slots for ${date}:\n${offered
            .map((t, i) => `${i + 1}. ${t}`)
            .join('\n')}`,
        };
      }

      return {
        text: `Great, ${date} works! What time? Here are some free slots:\n${offered
          .map((t, i) => `${i + 1}. ${t}`)
          .join('\n')}`,
        actions: slots.slice(0, 5).map((s) => ({
          type: 'slot_choice' as const,
          label: `${s.startTimeLocal}–${s.endTimeLocal}`,
          slot: s.startTimeLocal,
        })),
      };
    },

    async confirmAndCreatePayment(traderId, senderId, conversationId, date, startTime) {
      const rules = await getTraderWorkRules(traderId);
      try {
        const booking = await createBooking({
          traderId,
          date,
          startTime,
          customerName: senderId,
          customerPhone: senderId,
          serviceDescription: 'Booked via chat',
          conversationId,
        });

        await updateBookingStatus(booking.id, BookingStatus.PAYMENT_PENDING);

        const payment = await createPaymentForBooking(booking.id);
        await deps.writeState(conversationId, {
          step: 'awaiting_payment',
          date,
          startTime,
          bookingId: booking.id,
        });

        const feeText = (rules.bookingFee / 100).toFixed(2);
        return {
          text: `Booking confirmed for ${date} at ${startTime}. Total: $${feeText}. Complete your payment here:\n${payment.checkoutUrl ?? 'Pending'}`,
          actions: payment.checkoutUrl
            ? [{ type: 'payment_link' as const, label: 'Pay now', url: payment.checkoutUrl }]
            : [],
        };
      } catch (err) {
        await deps.writeState(conversationId, { step: 'offer_slots', date });
        throw err;
      }
    },

    async handleCustomerMessage(traderId, senderId, content, channel) {
      const trader = await getTraderOrThrow(traderId);
      const timeZone = trader.timezone;

      const conversation = await deps.getOrCreateConversation(traderId, channel, senderId);
      const state = await deps.readState(conversation.id);

      const text = content.trim();

      // Re-surface the payment link if the customer is mid-payment.
      if (state.step === 'awaiting_payment' || state.step === 'complete') {
        const booking = state.bookingId ? await findBooking(traderId, conversation.id) : null;
        if (
          booking?.payment?.checkoutUrl &&
          booking.status === BookingStatus.PAYMENT_PENDING
        ) {
          await deps.writeState(conversation.id, { ...state, step: 'awaiting_payment' });
          return {
            text: `Your booking is ready. Complete payment here:\n${booking.payment.checkoutUrl}\n\nType "start over" to book another appointment.`,
            actions: [{ type: 'payment_link', label: 'Pay now', url: booking.payment.checkoutUrl }],
          };
        }
      }

      if (/^(start over|reset|new booking|book another)\b/i.test(text)) {
        await deps.writeState(conversation.id, { step: 'idle' });
        return {
          text: 'Sure! What date would you like to book? (e.g. tomorrow, 2026-08-20)',
        };
      }

      switch (state.step) {
        case 'idle':
        case 'complete': {
          const date = parseDateWord(text, timeZone);
          const bookingIntent = /booking|book|appointment|slot|schedule|reserve|want|need|would like|looking/i.test(text);
          if (!bookingIntent && !date) {
            return {
              text: 'Hi! I can help you book a slot with us. Try something like: "I want a booking tomorrow at 10am".',
            };
          }
          if (date) {
            const time = hasTime(text) ? normalizeTime(text) : null;
            return engine.offerDateAndTime(date, time, traderId, timeZone, conversation.id, deps);
          }
          await deps.writeState(conversation.id, { step: 'collect_date' });
          return {
            text: 'What day would you like to book? (e.g. today, tomorrow, or a date like 2026-08-20)',
          };
        }

        case 'collect_date': {
          const date = parseDateWord(text, timeZone);
          if (!date) {
            return {
              text: 'I didn\'t catch the date. Try "today", "tomorrow", or a date like 2026-08-20.',
            };
          }
          const time = hasTime(text) ? normalizeTime(text) : null;
          return engine.offerDateAndTime(date, time, traderId, timeZone, conversation.id, deps);
        }

        case 'collect_time': {
          const time = normalizeTime(text);
          if (!time || !state.date) {
            return { text: `For ${state.date ?? 'that day'}, what time would you like? (e.g. 10am, 14:30)` };
          }
          return engine.offerDateAndTime(state.date, time, traderId, timeZone, conversation.id, deps);
        }

        case 'offer_slots': {
          const offered = state.offeredSlots ?? [];
          const pickIndex = /^\d+$/.test(text.trim())
            ? Number(text.trim()) - 1
            : offered.findIndex((t) => t === normalizeTime(text) || t === text.trim());
          const chosen =
            pickIndex >= 0 && pickIndex < offered.length ? offered[pickIndex] : null;

          if (NO_RE.test(text)) {
            await deps.writeState(conversation.id, { step: 'collect_date' });
            return { text: 'No problem — which day would you like instead?' };
          }

          if (chosen || /confirm|yes|yeah|book|ok|okay|sure/i.test(text)) {
            const finalSlot = chosen ?? state.startTime;
            if (!finalSlot) {
              return {
                text: `Please reply with the number or time you want from:\n${offered.map((t, i) => `${i + 1}. ${t}`).join('\n')}`,
              };
            }
            return engine.confirmAndCreatePayment(
              traderId,
              senderId,
              conversation.id,
              state.date as string,
              finalSlot,
              deps,
            );
          }

          return {
            text: `Please reply with the number or time you want from:\n${offered.map((t, i) => `${i + 1}. ${t}`).join('\n')}`,
          };
        }

        default: {
          return { text: 'Let\'s start over. What date would you like to book?' };
        }
      }
    },
  };

  return engine;
}

export type BookingEngine = BookingEngineChat;