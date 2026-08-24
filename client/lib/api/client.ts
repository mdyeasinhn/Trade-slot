import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env";
import { ApiEnvelope, ApiError } from "@/lib/api/types";

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const env = getServerEnv();
  const token = cookieStore.get(env.AUTH_COOKIE_NAME)?.value;
  return token ?? null;
}

async function fetchApi<T>(
  path: string,
  options: RequestInit = {},
  requireAuth = true
): Promise<T> {
  const env = getServerEnv();
  const baseUrl = env.API_BASE_URL.replace(/\/$/, "");
  const url = `${baseUrl}${path}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (requireAuth) {
    const token = await getAuthToken();
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  });

  const envelope: ApiEnvelope<T> = await response.json();

  if (!envelope.success) {
    const error = envelope.error ?? { code: "UNKNOWN_ERROR", message: "An unknown error occurred" };
    throw new ApiError(error.code, error.message, response.status);
  }

  if (envelope.data === undefined) {
    throw new ApiError("EMPTY_RESPONSE", "Response data is missing", response.status);
  }

  return envelope.data;
}

export async function apiGet<T>(path: string, requireAuth = true): Promise<T> {
  return fetchApi<T>(path, { method: "GET" }, requireAuth);
}

export async function apiPost<T>(path: string, body: unknown, requireAuth = true): Promise<T> {
  return fetchApi<T>(path, { method: "POST", body: JSON.stringify(body) }, requireAuth);
}

export async function apiPatch<T>(path: string, body: unknown, requireAuth = true): Promise<T> {
  return fetchApi<T>(path, { method: "PATCH", body: JSON.stringify(body) }, requireAuth);
}

export async function apiDelete<T>(path: string, requireAuth = true): Promise<T> {
  return fetchApi<T>(path, { method: "DELETE" }, requireAuth);
}