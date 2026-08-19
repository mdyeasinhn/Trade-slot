import { fromZonedTime } from 'date-fns-tz';
import { parseTimeString } from '../config/constants';

/**
 * Date helpers. The domain keeps "calendar days" as YYYY-MM-DD date strings
 * and absolute job instants as JS Date (UTC). Trader `timezone` is used to
 * translate local wall-clock times like "tomorrow at 10am" into UTC instants.
 */

/// Return "YYYY-MM-DD" for a date in the given timezone.
export function formatDateInTz(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/// Parse "YYYY-MM-DD" returned by formatDateInTz back into a local-midnight date.
export function parseDate(dateStr: string): Date {
  const parts = dateStr.split('-').map(Number);
  const [y, m, d] = parts;
  if (parts.length !== 3 || !y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) {
    throw new Error(`Invalid date: "${dateStr}". Expected YYYY-MM-DD.`);
  }
  return new Date(Date.UTC(y, m - 1, d));
}

/// YYYY-MM-DD for a UTC date value (matches the @db.Date column).
export function formatUtcDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Convert a calendar date + local "HH:mm" time to an absolute UTC instant,
 * expressed in the given IANA timezone. Uses date-fns-tz so DST transitions
 * produce the correct instant.
 */
export function localDateTimeToUtc(
  dateStr: string,
  time: string,
  timeZone: string,
): Date {
  const local = `${dateStr}T${time}:00`;
  return fromZonedTime(local, timeZone);
}

/// Convert an absolute UTC instant into local "HH:mm" in a timezone.
export function utcToLocalTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace('24:', '00:');
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export { parseTimeString };