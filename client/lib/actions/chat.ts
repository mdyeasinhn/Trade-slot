"use server";

import { sendChatMessage, getAvailability } from "@/lib/api/endpoints";
import type { ChatReply, AvailabilityResponse, ApiError } from "@/lib/api/types";

export async function sendChatMessageAction(
  traderId: string,
  senderId: string,
  message: string
): Promise<{ success: boolean; data?: ChatReply; error?: string }> {
  try {
    const result = await sendChatMessage({ traderId, senderId, message });
    return { success: true, data: result };
  } catch (e) {
    const error = e as ApiError;
    return { success: false, error: error.message };
  }
}

export async function getAvailabilityAction(
  traderId: string,
  date: string
): Promise<{ success: boolean; data?: AvailabilityResponse; error?: string }> {
  try {
    const result = await getAvailability(traderId, date);
    return { success: true, data: result };
  } catch (e) {
    const error = e as ApiError;
    return { success: false, error: error.message };
  }
}