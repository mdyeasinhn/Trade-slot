"use server";

import { revalidatePath } from "next/cache";
import { getStripeConnectOnboardUrl, getStripeConnectStatus } from "@/lib/api/endpoints";
import type { ApiError, StripeConnectStatus } from "@/lib/api/types";

export async function getStripeOnboardUrlAction(): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const result = await getStripeConnectOnboardUrl();
    return { success: true, url: result.url };
  } catch (e) {
    const error = e as ApiError;
    return { success: false, error: error.message };
  }
}

export async function getStripeStatusAction(): Promise<StripeConnectStatus | null> {
  try {
    return await getStripeConnectStatus();
  } catch {
    return null;
  }
}

export async function refreshStripeStatusAction(): Promise<StripeConnectStatus | null> {
  revalidatePath("/dashboard/settings/stripe");
  return getStripeStatusAction();
}