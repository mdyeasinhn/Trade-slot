import { constants, parseTimeString } from '../../config/constants';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errors';
import { addMinutes, formatDateInTz, formatUtcDate, localDateTimeToUtc, parseDate, utcToLocalTime } from '../../utils/date';
import { getTraderOrThrow } from '../traders/trader.service';
import type { AvailableSlot, TraderWorkRules } from './booking.types';

/**
 * Slot scheduling: computes available slots for a date and validates that a
 * requested slot is free. All availability checks run against the database at
 * booking time — a frontend availability check is never trusted for final
 * creation (AGENT.md §8).
 */

/// Trader's effective rules: per-trader override falls back to platform config.
export async function getTraderWorkRules(traderId: string): Promise<TraderWorkRules> {
  const trader = await getTraderOrThrow(traderId);
  return {
    jobDurationMin: trader.jobDurationMin ?? constants.JOB_DURATION_MINUTES,
    bufferMin: trader.bufferMin ?? constants.TRAVEL_BUFFER_MINUTES,
    bookingFee: trader.bookingFee ?? constants.BOOKING_FEE,
    currency: constants.CURRENCY,
    timezone: trader.timezone,
    workDayStart: trader.workDayStart ?? constants.WORK_DAY_START,
    workDayEnd: trader.workDayEnd ?? constants.WORK_DAY_END,
  };
}

/**
 * Buffer-aware occupancy model. Every job occupies
 *   [startTime, endTime + bufferMin]
 * (its trailing travel buffer). A new slot [start, end] is blocked by an
 * existing booking `e` when those intervals overlap:
 *   start < e.endTime + e.bufferMin && e.startTime < end
 * This guarantees a minimum-`bufferMin` gap between consecutive jobs.
 */
export function isBookingBlocked(
  existing: { startTime: Date; endTime: Date; bufferMin: number },
  start: Date,
  end: Date,
): boolean {
  const occupiedUntil = addMinutes(existing.endTime, existing.bufferMin);
  return start < occupiedUntil && existing.startTime < end;
}

/**
 * Check a requested slot against existing bookings including the travel
 * buffer (see {@link isBookingBlocked}).
 */
export async function isSlotAvailable(
  traderId: string,
  requestedDate: Date,
  start: Date,
  end: Date,
  bufferMin: number,
  excludeBookingId?: string,
): Promise<boolean> {
  // Guard: the requested window must sit entirely on the requested day (in the
  // trader's timezone). This is enforced when computing slots, so this is a
  // defensive re-check.
  const bookingDay = formatUtcDate(requestedDate);
  const dayStart = parseDate(bookingDay);
  if (start < dayStart || end > addMinutes(dayStart, 24 * 60)) {
    return false;
  }

  const existing = await prisma.booking.findMany({
    where: {
      traderId,
      status: { not: 'CANCELLED' },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    select: { id: true, startTime: true, endTime: true, bufferMin: true },
  });

  return !existing.some((b) => isBookingBlocked(b, start, end));
}

/**
 * Compute the available slots for a trader on a calendar date. Generates
 * contiguous slots every `jobDurationMin` minutes between the trader's working
 * window and filters out any slot that conflicts with an existing booking
 * (job window + its buffer).
 */
export async function listAvailableSlots(
  traderId: string,
  dateStr: string,
): Promise<AvailableSlot[]> {
  const rules = await getTraderWorkRules(traderId);
  const { jobDurationMin, bufferMin, timezone, workDayStart, workDayEnd } = rules;

  const dateOnly = parseDate(dateStr);
  const { hour: startHour, minute: startMinute } = parseTimeString(workDayStart);
  const { hour: endHour, minute: endMinute } = parseTimeString(workDayEnd);

  // Working window as UTC instants for the requested local date.
  const windowStart = localDateTimeToUtc(
    dateStr,
    `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`,
    timezone,
  );
  const windowEnd = localDateTimeToUtc(
    dateStr,
    `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`,
    timezone,
  );

  if (windowEnd <= windowStart) {
    return [];
  }

  // Candidate slots: contiguous, one per duration unit.
  const candidates: { start: Date; end: Date }[] = [];
  let cursor = windowStart;
  while (addMinutes(cursor, jobDurationMin) <= windowEnd) {
    candidates.push({ start: cursor, end: addMinutes(cursor, jobDurationMin) });
    cursor = addMinutes(cursor, jobDurationMin);
  }

  const existing = await prisma.booking.findMany({
    where: {
      traderId,
      status: { not: 'CANCELLED' },
      startTime: { lt: addMinutes(windowEnd, Math.max(constants.TRAVEL_BUFFER_MINUTES, bufferMin)) },
      endTime: { gt: addMinutes(windowStart, -Math.max(constants.TRAVEL_BUFFER_MINUTES, bufferMin)) },
    },
    select: { id: true, startTime: true, endTime: true, bufferMin: true },
  });

  const slots: AvailableSlot[] = [];
  for (const candidate of candidates) {
    const blocked = existing.some((b) => isBookingBlocked(b, candidate.start, candidate.end));
    if (blocked) continue;

    slots.push({
      startTimeLocal: utcToLocalTime(candidate.start, timezone),
      endTimeLocal: utcToLocalTime(candidate.end, timezone),
      startTime: candidate.start,
      endTime: candidate.end,
    });
  }

  return slots;
}

/// Resolve a SlotRequest into concrete UTC instants and validate availability.
/// `dateOnly` is the @db.Date key for the requestedDate column.
export async function resolveSlotForBooking(params: {
  traderId: string;
  date: string;
  startTime: string;
  bufferMin?: number;
}) {
  const rules = await getTraderWorkRules(params.traderId);
  const { jobDurationMin, bufferMin, timezone } = rules;

  const start = localDateTimeToUtc(params.date, params.startTime, timezone);
  const end = addMinutes(start, jobDurationMin);

  // The job must end before the trader's local working day ends.
  const dateOnly = parseDate(params.date);
  const { hour: endHour, minute: endMinute } = parseTimeString(rules.workDayEnd);
  const windowEnd = localDateTimeToUtc(
    params.date,
    `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`,
    timezone,
  );
  if (end > windowEnd) {
    throw AppError.slotUnavailable(
      'That start time is too late — the job would run past the working day.',
    );
  }

  const available = await isSlotAvailable(params.traderId, dateOnly, start, end, bufferMin);
  if (!available) {
    throw AppError.slotUnavailable();
  }

  return {
    rules,
    dateOnly,
    start,
    end,
    jobDurationMin,
    bufferMin,
    timezone,
  };
}

export { formatDateInTz };