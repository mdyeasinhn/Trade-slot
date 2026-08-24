import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env";

export async function middleware(request: NextRequest) {
  const env = getServerEnv();
  const token = request.cookies.get(env.AUTH_COOKIE_NAME)?.value;

  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isAuth = request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/register");

  if (isDashboard && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuth && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};