import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type {
  AuthResult,
  Booking,
  BookingStatus,
  Business,
  ChatMessageRequest,
  ChatReply,
  ConnectStatus,
  CurrentUser,
  HealthResponse,
  Trader,
  WorkArea,
} from "@/lib/api/types";

/** Every backend path in one place. */

export const endpoints = {
  health: "/api/health",

  auth: {
    register: "/api/auth/register",
    login: "/api/auth/login",
  },

  users: {
    me: "/api/users/me",
  },

  businesses: {
    byId: (id: string) => `/api/businesses/${id}`,
  },

  traders: {
    byId: (id: string) => `/api/traders/${id}`,
    workArea: (id: string) => `/api/traders/${id}/work-area`,
  },

  bookings: {
    root: "/api/bookings",
    availability: "/api/bookings/availability",
    byId: (id: string) => `/api/bookings/${id}`,
    status: (id: string) => `/api/bookings/${id}/status`,
  },

  chat: {
    message: "/api/chat/message",
  },

  payments: {
    create: "/api/payments/create",
  },

  stripeConnect: {
    onboard: "/api/stripe/connect/onboard",
    status: "/api/stripe/connect/status",
  },
} as const;

export function getHealth(): Promise<HealthResponse> {
  return apiGet(endpoints.health, false);
}

export function registerUser(data: {
  email: string;
  password: string;
  name: string;
  businessName?: string;
  phone?: string;
}): Promise<AuthResult> {
  return apiPost(endpoints.auth.register, data, false);
}

export function loginUser(data: { email: string; password: string }): Promise<AuthResult> {
  return apiPost(endpoints.auth.login, data, false);
}

export function getMe(): Promise<CurrentUser> {
  return apiGet(endpoints.users.me);
}

export function getBusiness(id: string): Promise<Business> {
  return apiGet(endpoints.businesses.byId(id));
}

export function getTrader(id: string): Promise<Trader> {
  return apiGet(endpoints.traders.byId(id));
}

export function updateTrader(id: string, data: Partial<Pick<Trader, "name" | "phone">>): Promise<Trader> {
  return apiPatch(endpoints.traders.byId(id), data);
}

export function setWorkArea(
  traderId: string,
  data: { date: string; area: string } | { date: string; centerLat: number; centerLng: number; radiusKm: number }
): Promise<WorkArea> {
  return apiPost(endpoints.traders.workArea(traderId), data);
}

export async function getWorkArea(traderId: string, date: string): Promise<WorkArea | null> {
  try {
    return await apiGet(`${endpoints.traders.workArea(traderId)}?date=${date}`);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "NOT_FOUND") return null;
    throw error;
  }
}

export function sendChatMessage(data: ChatMessageRequest): Promise<ChatReply> {
  return apiPost(endpoints.chat.message, data, false);
}

export function getAvailability(traderId: string, date: string): Promise<unknown> {
  return apiGet(`${endpoints.bookings.availability}?traderId=${traderId}&date=${date}`, false);
}

export function createBooking(data: Record<string, unknown>): Promise<Booking> {
  return apiPost(endpoints.bookings.root, data);
}

export function getBookings(date?: string): Promise<Booking[]> {
  const path = date ? `${endpoints.bookings.root}?date=${date}` : endpoints.bookings.root;
  return apiGet(path);
}

export function getBooking(id: string): Promise<Booking> {
  return apiGet(endpoints.bookings.byId(id));
}

export function updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
  return apiPatch(endpoints.bookings.status(id), { status });
}

export function createPaymentSession(bookingId: string): Promise<{ url: string }> {
  return apiPost(endpoints.payments.create, { bookingId });
}

export function getStripeConnectOnboardUrl(): Promise<{ url: string }> {
  return apiPost(endpoints.stripeConnect.onboard, {});
}

export function getStripeConnectStatus(): Promise<ConnectStatus> {
  return apiGet(endpoints.stripeConnect.status);
}
