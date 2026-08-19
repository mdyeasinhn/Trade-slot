import { describe, expect, it } from 'vitest';
import {
  addMinutes,
  formatUtcDate,
  localDateTimeToUtc,
  parseDate,
  utcToLocalTime,
} from '../src/utils/date';
import { formatDateInTz } from '../src/utils/date';

describe('date utils', () => {
  it('parses YYYY-MM-DD as UTC midnight', () => {
    const d = parseDate('2026-08-20');
    expect(d.toISOString()).toBe('2026-08-20T00:00:00.000Z');
  });

  it('formats a UTC midnight date back to YYYY-MM-DD', () => {
    expect(formatUtcDate(new Date('2026-08-20T00:00:00Z'))).toBe('2026-08-20');
  });

  it('round-trips a UTC/day with a timezone offset', () => {
    // 2026-08-20 10:00 America/New_York == UTC-04:00 (summer) => 14:00 UTC.
    const utc = localDateTimeToUtc('2026-08-20', '10:00', 'America/New_York');
    expect(utc.toISOString()).toBe('2026-08-20T14:00:00.000Z');
    expect(utcToLocalTime(utc, 'America/New_York')).toBe('10:00');
  });

  it('handles UTC timezone as-is', () => {
    const utc = localDateTimeToUtc('2026-08-20', '10:00', 'UTC');
    expect(utc.toISOString()).toBe('2026-08-20T10:00:00.000Z');
    expect(utcToLocalTime(utc, 'UTC')).toBe('10:00');
  });

  it('adds minutes across midnight', () => {
    const d = new Date('2026-08-20T23:30:00Z');
    expect(addMinutes(d, 90).toISOString()).toBe('2026-08-21T01:00:00.000Z');
  });

  it('formats a date in a foreign timezone', () => {
    expect(formatDateInTz(new Date('2026-08-20T02:00:00Z'), 'Asia/Tokyo')).toBe('2026-08-20');
    expect(formatDateInTz(new Date('2026-08-19T20:00:00Z'), 'Asia/Tokyo')).toBe('2026-08-20');
  });
});