import { BookingStatus, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/errors';
import { parseDate } from '../../utils/date';
import { getTraderOrThrow } from '../traders/trader.service';
import type { SlotRequest } from './booking.types';
import { isBookingBlocked, resolveSlotForBooking } from './scheduling.service';

/**
 * Booking persistence. Availability is re-checked inside a transaction while
 * holding a PostgreSQL advisory lock keyed on (traderId, requestedDate), so
 * two concurrent requests cannot confirm the same slot (AGENT.md §8). The
 * `booking_no_overlap` exclusion constraint acts as a final backstop.
 */

function advisoryLockKey(traderId: string, date: Date): number {
  let hash = 2166136261;
  const input = `${traderId}:${date.toISOString()}`;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/// Create a booking after a concurrency-safe availability re-check.
export async function createBooking(request: SlotRequest) {
  const trader = await getTraderOrThrow(request.traderId);

  const resolved = await resolveSlotForBooking({
    traderId: request.traderId,
    date: request.date,
    startTime: request.startTime,
  });

  try {
    const booking = await prisma.$transaction(async (tx) => {
      // Serialize all booking creation for this trader+day.
      const lockId = advisoryLockKey(request.traderId, resolved.dateOnly);
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockId})`;

      // Re-check availability under the lock (in case a sibling tx committed
      // between our first check and the lock acquisition).
      const blocked = await tx.booking.findMany({
        where: {
          traderId: request.traderId,
          status: { not: BookingStatus.CANCELLED },
        },
        select: { id: true, startTime: true, endTime: true, bufferMin: true },
      });
      if (blocked.some((b) => isBookingBlocked(b, resolved.start, resolved.end))) {
        throw ApiError.slotUnavailable();
      }

      return tx.booking.create({
        data: {
          traderId: request.traderId,
          conversationId: request.conversationId,
          customerName: request.customerName,
          customerPhone: request.customerPhone,
          serviceDescription: request.serviceDescription,
          requestedDate: resolved.dateOnly,
          startTime: resolved.start,
          endTime: resolved.end,
          jobDurationMin: resolved.jobDurationMin,
          bufferMin: resolved.bufferMin,
          bookingFee: resolved.rules.bookingFee,
          currency: resolved.rules.currency,
          status: BookingStatus.REQUESTED,
        },
        include: { payment: true },
      });
    });
    return booking;
  } catch (err) {
    if (isUniqueViolation(err) || isExclusionViolation(err)) {
      throw ApiError.doubleBooking();
    }
    throw err;
  }
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: string }).code === 'P2002'
  );
}

function isExclusionViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { meta?: { code?: string } }).meta?.code === '23P01'
  );
}

export async function listBookings(traderId: string, opts: { date?: string } = {}) {
  const where: Prisma.BookingWhereInput = { traderId };
  if (opts.date) {
    where.requestedDate = parseDate(opts.date);
  }
  return prisma.booking.findMany({
    where,
    include: { payment: true },
    orderBy: { startTime: 'asc' },
  });
}

export async function getBookingOrThrow(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });
  if (!booking) throw ApiError.notFound('Booking not found.');
  return booking;
}

const statusTransitions: Record<BookingStatus, readonly BookingStatus[]> = {
  [BookingStatus.REQUESTED]: [BookingStatus.CONFIRMED, BookingStatus.PAYMENT_PENDING, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [BookingStatus.PAYMENT_PENDING, BookingStatus.CANCELLED],
  [BookingStatus.PAYMENT_PENDING]: [BookingStatus.PAID, BookingStatus.CANCELLED, BookingStatus.REQUESTED],
  [BookingStatus.PAID]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
};

/// Update a booking's status with transition validation.
export async function updateBookingStatus(bookingId: string, next: BookingStatus, opts?: {
  cancelledReason?: string;
  force?: boolean;
}) {
  const booking = await getBookingOrThrow(bookingId);

  if (!opts?.force && booking.status === next) return booking;

  if (!opts?.force && !statusTransitions[booking.status]?.includes(next)) {
    throw ApiError.invalidState(
      `Cannot move booking from ${booking.status} to ${next}.`,
    );
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: next,
      cancelledAt: next === BookingStatus.CANCELLED ? new Date() : undefined,
      cancelledReason: next === BookingStatus.CANCELLED ? opts?.cancelledReason : undefined,
    },
    include: { payment: true },
  });
}