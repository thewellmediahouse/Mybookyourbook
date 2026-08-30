import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/** Edge middleware. Next.js 16 `proxy.ts` is Node middleware; OpenNext 1.20.2 cannot bundle that for Workers. */
export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/admin");

  if (isProtected && !sessionCookie) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (sessionCookie && pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/dashboard/create", request.url));
  }

  if (sessionCookie && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard/create", request.url));
  }

  return NextResponse.next();
}

export { middleware as proxy };

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/admin",
    "/admin/:path*",
    "/login",
    "/signup",
  ],
};
