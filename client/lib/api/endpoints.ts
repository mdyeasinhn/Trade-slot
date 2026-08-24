import {
  apiGet,
  apiPost,
  apiPatch,
} from "@/lib/api/client";
import type {
  User,
  Business,
  Trader,
  WorkArea,
  Booking,
  AvailabilityResponse,
  ChatReply,
  ChatMessageRequest,
  StripeConnectStatus,
  HealthResponse,
  BookingStatus,
} from "@/lib/api/types";

export async function getHealth(): Promise<HealthResponse> {
  return apiGet("/api/health", false);
}

export async function registerUser(data: { email: string; password: string; name: string }): Promise<{ token: string; user: User }> {
  return apiPost("/api/auth/register", data, false);
}

export async function loginUser(data: { email: string; password: string }): Promise<{ token: string; user: User }> {
  return apiPost("/api/auth/login", data, false);
}

export async function getMe(): Promise<User> {
  return apiGet("/api/users/me");
}

export async function getBusiness(id: string): Promise<Business> {
  return apiGet(`/api/businesses/${id}`);
}

export async function getTrader(id: string): Promise<Trader> {
  return apiGet(`/api/traders/${id}`);
}

export async function updateTrader(id: string, data: Partial<Pick<Trader, "name" | "phone">>): Promise<Trader> {
  return apiPatch(`/api/traders/${id}`, data);
}

export async function setWorkArea(traderId: string, data: { date: string; centerLat: number; centerLng: number; radiusKm: number }): Promise<WorkArea> {
  return apiPost(`/api/traders/${traderId}/work-area`, data);
}

export async function getWorkArea(traderId: string, date: string): Promise<WorkArea | null> {
  try {
    return await apiGet(`/api/traders/${traderId}/work-area?date=${date}`);
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "NOT_FOUND") return null;
    throw e;
  }
}

export async function sendChatMessage(data: ChatMessageRequest): Promise<ChatReply> {
  return apiPost("/api/chat/message", data, false);
}

export async function getAvailability(traderId: string, date: string): Promise<AvailabilityResponse> {
  return apiGet(`/api/bookings/availability?traderId=${traderId}&date=${date}`, false);
}

export async function createBooking(data: {
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
}): Promise<Booking> {
  return apiPost("/api/bookings", data);
}

export async function getBookings(date?: string): Promise<Booking[]> {
  const path = date ? `/api/bookings?date=${date}` : "/api/bookings";
  return apiGet(path);
}

export async function getBooking(id: string): Promise<Booking> {
  return apiGet(`/api/bookings/${id}`);
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
  return apiPatch(`/api/bookings/${id}/status`, { status });
}

export async function createPaymentSession(bookingId: string): Promise<{ url: string }> {
  return apiPost("/api/payments/create", { bookingId });
}

export async function getStripeConnectOnboardUrl(): Promise<{ url: string }> {
  return apiPost("/api/stripe/connect/onboard", {});
}

export async function getStripeConnectStatus(): Promise<StripeConnectStatus> {
  return apiGet("/api/stripe/connect/status");
}