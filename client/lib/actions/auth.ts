"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { setAuthCookie, clearAuthCookie } from "@/lib/auth";
import { apiPost } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { ApiError, AuthResult as ApiAuthResult } from "@/lib/api/types";

export interface AuthResult {
  success: boolean;
  error?: string;
}

export async function registerAction(formData: FormData): Promise<AuthResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const businessName = (formData.get("businessName") as string | null)?.trim() || undefined;
  const phone = (formData.get("phone") as string | null)?.trim() || undefined;

  if (!email || !password || !name) {
    return { success: false, error: "All fields are required" };
  }
  if (!businessName && !phone) {
    return { success: false, error: "Business name or phone is required" };
  }

  let result: ApiAuthResult;
  try {
    result = await apiPost<ApiAuthResult>(
      endpoints.auth.register,
      { email, password, name, businessName, phone },
      false
    );
  } catch (e) {
    const error = e as ApiError;
    return { success: false, error: error.message };
  }

  await setAuthCookie(result.token);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function loginAction(formData: FormData): Promise<AuthResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  let result: ApiAuthResult;
  try {
    result = await apiPost<ApiAuthResult>(
      endpoints.auth.login,
      { email, password },
      false
    );
  } catch (e) {
    const error = e as ApiError;
    return { success: false, error: error.message };
  }

  await setAuthCookie(result.token);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await clearAuthCookie();
  redirect("/login");
}