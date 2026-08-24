import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/lib/api/endpoints";
import { setAuthCookie, getServerEnv } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
    }

    const result = await loginUser({ email, password });
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