"use server";

import { revalidatePath } from "next/cache";
import {
  createBooking,
  getBookings,
  getBooking,
  updateBookingStatus,
  createPaymentSession,
} from "@/lib/api/endpoints";
import type { ApiError, Booking, BookingStatus } from "@/lib/api/types";

export interface BookingActionResult {
  success: boolean;
  error?: string;
  data?: Booking;
}

export async function createBookingAction(formData: FormData): Promise<BookingActionResult> {
  const traderId = formData.get("traderId") as string;
  const customerName = formData.get("customerName") as string;
  const customerEmail = formData.get("customerEmail") as string;
  const customerPhone = formData.get("customerPhone") as string;
  const addressLine1 = formData.get("addressLine1") as string;
  const addressLine2 = formData.get("addressLine2") as string;
  const city = formData.get("city") as string;
  const postcode = formData.get("postcode") as string;
  const lat = parseFloat(formData.get("lat") as string);
  const lng = parseFloat(formData.get("lng") as string);
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;

  if (!traderId || !customerName || !customerEmail || !addressLine1 || !city || !postcode || isNaN(lat) || isNaN(lng) || !startTime || !endTime) {
    return { success: false, error: "All required fields must be filled" };
  }

  try {
    const result = await createBooking({
      traderId,
      customerName,
      customerEmail,
      customerPhone: customerPhone || undefined,
      addressLine1,
      addressLine2: addressLine2 || undefined,
      city,
      postcode,
      lat,
      lng,
      startTime,
      endTime,
    });
    revalidatePath("/dashboard/bookings");
    return { success: true, data: result };
  } catch (e) {
    const error = e as ApiError;
    return { success: false, error: error.message };
  }
}

export async function getBookingsAction(date?: string): Promise<Booking[]> {
  return getBookings(date);
}

export async function getBookingAction(id: string): Promise<Booking | null> {
  try {
    return await getBooking(id);
  } catch {
    return null;
  }
}

export async function updateBookingStatusAction(id: string, status: BookingStatus): Promise<BookingActionResult> {
  try {
    const result = await updateBookingStatus(id, status);
    revalidatePath("/dashboard/bookings");
    revalidatePath(`/dashboard/bookings/${id}`);
    return { success: true, data: result };
  } catch (e) {
    const error = e as ApiError;
    return { success: false, error: error.message };
  }
}

export async function createPaymentSessionAction(bookingId: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const result = await createPaymentSession(bookingId);
    return { success: true, url: result.url };
  } catch (e) {
    const error = e as ApiError;
    return { success: false, error: error.message };
  }
}