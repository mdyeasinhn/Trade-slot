"use server";

import { revalidatePath } from "next/cache";
import { setWorkArea, getWorkArea } from "@/lib/api/endpoints";
import type { ApiError } from "@/lib/api/types";

export interface WorkAreaResult {
  success: boolean;
  error?: string;
  data?: { date: string; centerLat: number; centerLng: number; radiusKm: number };
}

export async function setWorkAreaAction(formData: FormData): Promise<WorkAreaResult> {
  const date = formData.get("date") as string;
  const centerLat = parseFloat(formData.get("centerLat") as string);
  const centerLng = parseFloat(formData.get("centerLng") as string);
  const radiusKm = parseFloat(formData.get("radiusKm") as string);

  if (!date || isNaN(centerLat) || isNaN(centerLng) || isNaN(radiusKm)) {
    return { success: false, error: "All fields are required" };
  }

  try {
    const result = await setWorkArea("", { date, centerLat, centerLng, radiusKm });
    revalidatePath("/dashboard/work-area");
    return { success: true, data: result };
  } catch (e) {
    const error = e as ApiError;
    return { success: false, error: error.message };
  }
}

export async function getWorkAreaAction(date: string) {
  try {
    return await getWorkArea("", date);
  } catch {
    return null;
  }
}