/**
 * DTOs mirroring the TradeSlot backend contract (`/api-docs.json`).
 * Keep this file aligned with the backend — it is the source of truth.
 * Dates arrive as ISO-8601 strings; money as integer minor units.
 */

// --- Response envelope -----------------------------------------------------

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: ApiErrorPayload;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

/** Error codes the backend emits (`server/src/utils/errors.ts`). */
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "SLOT_UNAVAILABLE"
  | "DOUBLE_BOOKING"
  | "INVALID_STATE"
  | "PAYMENT_ERROR"
  | "STRIPE_ERROR"
  | "WHATSAPP_ERROR"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

// --- Auth / identity -------------------------------------------------------

export type Role = "TRADER" | "ADMIN";

/** `POST /api/auth/login` · `POST /api/auth/register` */
export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    traderId?: string;
  };
}

/** `GET /api/users/me` */
export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  trader: { id: string } | null;
}

export interface Business {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** `GET /api/traders/:id` — includes the owning business and user. */
export interface Trader {
  id: string;
  businessId: string;
  userId: string | null;
  name: string;
  phone: string | null;
  /** IANA timezone. All local times below are interpreted in this zone. */
  timezone: string;
  /** Working window in the trader's local time, "HH:mm". */
  workDayStart: string;
  workDayEnd: string;
  jobDurationMin: number | null;
  bufferMin: number | null;
  /** Minor units. Resolved server-side; never sent by the client. */
  bookingFee: number | null;
  stripeAccountId: string | null;
  stripeOnboardingDone: boolean;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  business?: Business;
  user?: { id: string; email: string } | null;
}

// --- Work areas ------------------------------------------------------------

/** `GET|POST /api/traders/:id/work-area` — a free-text area for one date. */
export interface WorkArea {
  id: string;
  traderId: string;
  /** ISO instant at midnight UTC; the calendar-day key. */
  date: string;
  area: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkAreaInput {
  /** "YYYY-MM-DD" in the trader's timezone. */
  date: string;
  area: string;
}

// --- Bookings --------------------------------------------------------------

export type BookingStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

/** Payment summary embedded in a booking. */
export interface BookingPayment {
  id: string;
  status: PaymentStatus | string;
  checkoutUrl: string | null;
  stripePaymentIntentId: string | null;
  stripeCheckoutSessionId: string | null;
}

export interface Booking {
  id: string;
  traderId: string;
  conversationId: string | null;
  customerName: string;
  customerPhone: string;
  serviceDescription: string | null;
  /** ISO instant at midnight UTC for the job's calendar day. */
  requestedDate: string;
  /** Absolute UTC instants for the job (travel buffer excluded). */
  startTime: string;
  endTime: string;
  jobDurationMin: number;
  bufferMin: number;
  /** Minor units, resolved server-side. */
  bookingFee: number;
  /** ISO-4217 lowercase, e.g. "usd". */
  currency: string;
  status: BookingStatus;
  cancelledAt: string | null;
  cancelledReason: string | null;
  createdAt: string;
  updatedAt: string;
  payment?: BookingPayment | null;
}

/** `POST /api/bookings` — the backend resolves duration, buffer and fee. */
export interface CreateBookingInput {
  traderId: string;
  /** "YYYY-MM-DD" in the trader's timezone. */
  date: string;
  /** "HH:mm" local start time. */
  startTime: string;
  customerName: string;
  customerPhone: string;
  serviceDescription?: string;
  conversationId?: string;
}

export interface UpdateBookingStatusInput {
  status: BookingStatus;
  cancelledReason?: string;
}

/** `GET /api/bookings/availability` returns a bare array of these. */
export interface AvailableSlot {
  /** "HH:mm" in the trader's timezone — display these, don't recompute. */
  startTimeLocal: string;
  endTimeLocal: string;
  /** Absolute UTC instants. */
  startTime: string;
  endTime: string;
}

// --- Chat ------------------------------------------------------------------

/**
 * Channel-neutral reply from `POST /api/chat/message`. The backend owns the
 * dialogue state; the client only renders this and echoes user choices back.
 */
export interface ChatReply {
  text: string;
  actions?: ChatAction[];
}

export type ChatAction =
  | { type: "text"; label: string }
  | { type: "slot_choice"; label: string; slot: string }
  | { type: "payment_link"; label: string; url: string };

export interface ChatMessageRequest {
  traderId: string;
  /** Stable per-browser id. Not a secret. */
  senderId: string;
  message: string;
}

// --- Payments / Stripe Connect ---------------------------------------------

/** `POST /api/payments/create` */
export interface Payment {
  id: string;
  bookingId: string;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  connectedAccountId: string | null;
  amount: number;
  applicationFee: number;
  currency: string;
  checkoutUrl: string | null;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** `POST /api/stripe/connect/onboard` */
export interface ConnectOnboardResult {
  accountId: string;
  url: string;
}

/**
 * `GET /api/stripe/connect/status`. When no account exists the backend returns
 * only `{ connected: false, onboardingComplete: false }`.
 */
export interface ConnectStatus {
  connected: boolean;
  onboardingComplete: boolean;
  id?: string;
  detailsSubmitted?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
}

/** `GET /api/health` — not wrapped in the success envelope's `data`. */
export interface HealthResponse {
  success: boolean;
  status: string;
}
