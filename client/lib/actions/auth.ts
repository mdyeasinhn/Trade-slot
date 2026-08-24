"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { setAuthCookie, clearAuthCookie } from "@/lib/auth";
import { registerUser, loginUser } from "@/lib/api/endpoints";
import type { ApiError } from "@/lib/api/types";

export interface AuthResult {
  success: boolean;
  error?: string;
}

export async function registerAction(formData: FormData): Promise<AuthResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !name) {
    return { success: false, error: "All fields are required" };
  }

  try {
    const result = await registerUser({ email, password, name });
    await setAuthCookie(result.token);
    revalidatePath("/dashboard");
    redirect("/dashboard");
  } catch (e) {
    const error = e as ApiError;
    return { success: false, error: error.message };
  }
}

export async function loginAction(formData: FormData): Promise<AuthResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  try {
    const result = await loginUser({ email, password });
    await setAuthCookie(result.token);
    revalidatePath("/dashboard");
    redirect("/dashboard");
  } catch (e) {
    const error = e as ApiError;
    return { success: false, error: error.message };
  }
}

export async function logoutAction(): Promise<void> {
  await clearAuthCookie();
  redirect("/login");
}