import { Channel } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import type { MessageChannel } from '../messaging/types';
import { createBookingEngine, BookingEngineState } from './booking.engine';

/**
 * Singleton wiring of the booking engine to PostgreSQL. The engine itself is
 * transport-agnostic; this instance is what both Web Chat and WhatsApp call.
 */

const emptyState: BookingEngineState = { step: 'idle' };

function sanitizeState(value: unknown): BookingEngineState {
  if (!value || typeof value !== 'object') return emptyState;
  const raw = value as Partial<BookingEngineState>;
  const allowedSteps = ['idle', 'collect_date', 'collect_time', 'offer_slots', 'awaiting_payment', 'complete'];
  const step = allowedSteps.includes(raw.step as string) ? (raw.step as BookingEngineState['step']) : 'idle';
  return {
    step,
    ...(typeof raw.date === 'string' ? { date: raw.date } : {}),
    ...(typeof raw.startTime === 'string' ? { startTime: raw.startTime } : {}),
    ...(Array.isArray(raw.offeredSlots) ? { offeredSlots: raw.offeredSlots.filter((s) => typeof s === 'string') } : {}),
    ...(typeof raw.customerName === 'string' ? { customerName: raw.customerName } : {}),
    ...(typeof raw.customerPhone === 'string' ? { customerPhone: raw.customerPhone } : {}),
    ...(typeof raw.serviceDescription === 'string' ? { serviceDescription: raw.serviceDescription } : {}),
    ...(typeof raw.bookingId === 'string' ? { bookingId: raw.bookingId } : {}),
  };
}

export const bookingEngine = createBookingEngine({
  async getOrCreateConversation(traderId, channel: MessageChannel, senderId) {
    const conversation = await prisma.conversation.upsert({
      where: {
        traderId_channel_senderId: {
          traderId,
          channel: channel as Channel,
          senderId,
        },
      },
      update: {},
      create: { traderId, channel: channel as Channel, senderId },
      select: { id: true },
    });
    return conversation;
  },

  async readState(conversationId) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { state: true },
    });
    return sanitizeState(conversation?.state);
  },

  async writeState(conversationId, state) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { state: state as object },
    });
  },
});