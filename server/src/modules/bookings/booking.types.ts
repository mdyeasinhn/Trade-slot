import type { Booking, BookingStatus } from '@prisma/client';

/// A bookable slot for a trader on a given date, expressed in the trader's
/// local wall-clock time plus the absolute UTC instants.
export interface AvailableSlot {
  /// Local start "HH:mm" in the trader's timezone (for display).
  startTimeLocal: string;
  /// Local end "HH:mm" in the trader's timezone.
  endTimeLocal: string;
  /// Absolute UTC instants for the job itself (buffer excluded).
  startTime: Date;
  endTime: Date;
}

/// Effective booking rules for a trader (per-trader override, else platform default).
export interface TraderWorkRules {
  jobDurationMin: number;
  bufferMin: number;
  bookingFee: number;
  currency: string;
  timezone: string;
  workDayStart: string;
  workDayEnd: string;
}

export interface SlotRequest {
  traderId: string;
  /// YYYY-MM-DD calendar day in the trader's timezone.
  date: string;
  /// Local start "HH:mm" in the trader's timezone.
  startTime: string;
  customerName: string;
  customerPhone: string;
  serviceDescription?: string;
  conversationId?: string;
}

export type BookingWithPayment = Booking & {
  payment?: {
    id: string;
    status: string;
    checkoutUrl: string | null;
    stripePaymentIntentId: string | null;
    stripeCheckoutSessionId: string | null;
  } | null;
};

export type { BookingStatus };