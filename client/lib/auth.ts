import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerEnv } from "@/lib/env";
import { apiGet } from "@/lib/api/client";
import type { User, Trader } from "@/lib/api/types";

export const AUTH_COOKIE_NAME = "tradeslot_session";

export async function getSession(): Promise<{ user: User; trader: Trader } | null> {
  const cookieStore = await cookies();
  const env = getServerEnv();
  const token = cookieStore.get(env.AUTH_COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const user = await apiGet("/api/users/me");
    const trader = await apiGet(`/api/traders/${user.id}`);
    return { user, trader };
  } catch {
    return null;
  }
}

export async function requireTrader(): Promise<{ user: User; trader: Trader }> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  const env = getServerEnv();
  cookieStore.set(env.AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  const env = getServerEnv();
  cookieStore.delete(env.AUTH_COOKIE_NAME);
}