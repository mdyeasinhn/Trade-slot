"use server";

import { revalidatePath } from "next/cache";
import { setWorkArea, getWorkArea, getBookings } from "@/lib/api/endpoints";
import { getSession } from "@/lib/auth";
import type { ApiError, Booking } from "@/lib/api/types";

export interface WorkAreaResult {
  success: boolean;
  error?: string;
  data?: { date: string; area: string };
}

export async function setWorkAreaAction(formData: FormData): Promise<WorkAreaResult> {
  const date = formData.get("date") as string;
  const area = formData.get("area") as string;

  if (!date || !area) {
    return { success: false, error: "All fields are required" };
  }

  const session = await getSession();
  if (!session?.trader?.id) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const result = await setWorkArea(session.trader.id, { date, area });
    revalidatePath("/dashboard/work-area");
    return { success: true, data: result };
  } catch (e) {
    const error = e as ApiError;
    return { success: false, error: error.message };
  }
}

export async function getWorkAreaAction(date: string) {
  const session = await getSession();
  if (!session?.trader?.id) {
    return null;
  }
  try {
    return await getWorkArea(session.trader.id, date);
  } catch {
    return null;
  }
}

export async function getBookingsAction(date: string): Promise<Booking[]> {
  const session = await getSession();
  if (!session?.trader?.id) {
    return [];
  }

  try {
    return await getBookings(date);
  } catch {
    return [];
  }
}