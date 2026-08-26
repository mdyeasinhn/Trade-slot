"use server";

import { updateTrader } from "@/lib/api/endpoints";
import { getSession } from "@/lib/auth";
import type { ApiError, Trader } from "@/lib/api/types";

export async function updateTraderAction(
  traderId: string,
  data: Parameters<typeof updateTrader>[1]
): Promise<{ success: true; data: Trader } | { success: false; error: string }> {
  const session = await getSession();
  if (!session?.trader?.id || session.trader.id !== traderId) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    return { success: true, data: await updateTrader(traderId, data) };
  } catch (error) {
    return { success: false, error: (error as ApiError).message };
  }
}