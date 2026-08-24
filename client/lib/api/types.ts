export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: ApiErrorPayload;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
}

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

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Business {
  id: string;
  name: string;
  timezone: string;
  createdAt: string;
}

export interface Trader {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone?: string;
  stripeConnected: boolean;
  createdAt: string;
}

export interface WorkArea {
  id: string;
  traderId: string;
  date: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  createdAt: string;
}

export interface Booking {
  id: string;
  traderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
  lat: number;
  lng: number;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  priceCents: number;
  depositCents: number;
  stripeSessionId?: string;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PAID"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface AvailabilityResponse {
  traderId: string;
  date: string;
  slots: AvailabilitySlot[];
  timezone: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatAction {
  type: "text_prompt" | "slot_choice" | "payment_link";
  label?: string;
  options?: ChatActionOption[];
  url?: string;
  payload?: unknown;
}

export interface ChatActionOption {
  value: string;
  label: string;
  description?: string;
}

export interface ChatReply {
  text: string;
  actions?: ChatAction[];
  conversationId?: string;
}

export interface ChatMessageRequest {
  traderId: string;
  senderId: string;
  message: string;
}

export interface StripeConnectStatus {
  connected: boolean;
  accountId?: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  onboardingUrl?: string;
}

export interface HealthResponse {
  status: "ok" | "degraded";
  timestamp: string;
  version: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}