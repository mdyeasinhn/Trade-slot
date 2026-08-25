import { NextRequest, NextResponse } from "next/server";
import { apiPost } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { setAuthCookie } from "@/lib/auth";
import type { AuthResult } from "@/lib/api/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
    }

    const result = await apiPost<AuthResult>(endpoints.auth.login, { email, password }, false);
    await setAuthCookie(result.token);

    return NextResponse.json({ success: true });
  } catch (e) {
    const error = e as Error & { code?: string; message?: string };
    return NextResponse.json(
      { success: false, error: error.message || "Login failed" },
      { status: error.code === "UNAUTHORIZED" ? 401 : 400 }
    );
  }
}