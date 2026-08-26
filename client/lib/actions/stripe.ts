"use server";

import { revalidatePath } from "next/cache";
import { getStripeConnectOnboardUrl, getStripeConnectStatus } from "@/lib/api/endpoints";
import type { ApiError, ConnectStatus } from "@/lib/api/types";

export async function getStripeOnboardUrlAction(): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const result = await getStripeConnectOnboardUrl();
    return { success: true, url: result.url };
  } catch (e) {
    const error = e as ApiError;
    return { success: false, error: error.message };
  }
}

export async function getStripeStatusAction(): Promise<{ status: ConnectStatus | null; error?: string }> {
  try {
    return { status: await getStripeConnectStatus() };
  } catch (e) {
    const error = e as ApiError;
    return { status: null, error: error.message };
  }
}

export async function refreshStripeStatusAction(): Promise<{ status: ConnectStatus | null; error?: string }> {
  revalidatePath("/dashboard/settings/stripe");
  return getStripeStatusAction();
}