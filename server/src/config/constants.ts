import { env } from './env';

export const constants = {
  JOB_DURATION_MINUTES: env.JOB_DURATION_MINUTES,
  TRAVEL_BUFFER_MINUTES: env.TRAVEL_BUFFER_MINUTES,
  BOOKING_FEE: env.BOOKING_FEE,
  APPLICATION_FEE: env.APPLICATION_FEE,
  CURRENCY: env.STRIPE_CURRENCY,
  WORK_DAY_START: env.WORK_DAY_START,
  WORK_DAY_END: env.WORK_DAY_END,
  DEFAULT_TIMEZONE: env.DEFAULT_TIMEZONE,
} as const;

/// Validate an "HH:mm" local time string and split into hour/minute parts.
export function parseTimeString(value: string): { hour: number; minute: number } {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error(`Invalid time string: "${value}"`);
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) throw new Error(`Invalid time string: "${value}"`);
  return { hour, minute };
}