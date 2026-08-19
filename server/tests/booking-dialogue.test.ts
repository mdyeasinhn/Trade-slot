import { describe, expect, it } from 'vitest';
import { normalizeTime, parseDateWord } from '../src/modules/bookings/booking.engine';

describe('booking engine dialogue — parseDateWord', () => {
  it('recognises explicit dates', () => {
    expect(parseDateWord('2026-08-20 10am', 'UTC')).toBe('2026-08-20');
  });

  it('recognises "today"', () => {
    const expected = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    expect(parseDateWord('I want a booking today', 'UTC')).toBe(expected);
  });

  it('recognises "tomorrow"', () => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 1);
    const expected = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
    expect(parseDateWord('tomorrow at 10am', 'UTC')).toBe(expected);
  });

  it('recognises a weekday', () => {
    expect(parseDateWord('on monday', 'UTC')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns null when no date is present', () => {
    expect(parseDateWord('hello there', 'UTC')).toBeNull();
  });
});

describe('booking engine dialogue — normalizeTime', () => {
  it('normalises 12-hour times', () => {
    expect(normalizeTime('10am')).toBe('10:00');
    expect(normalizeTime('10pm')).toBe('22:00');
    expect(normalizeTime('12pm')).toBe('12:00');
    expect(normalizeTime('12am')).toBe('00:00');
    expect(normalizeTime('1:30pm')).toBe('13:30');
  });

  it('normalises 24-hour times', () => {
    expect(normalizeTime('10')).toBe('10:00');
    expect(normalizeTime('14:30')).toBe('14:30');
  });

  it('rejects nonsense times', () => {
    expect(normalizeTime('25:00')).toBeNull();
    expect(normalizeTime('banana')).toBeNull();
    expect(normalizeTime('13pm')).toBeNull();
  });
});