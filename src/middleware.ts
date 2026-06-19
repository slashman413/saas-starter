import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Protect the dashboard area. Unauthenticated users are redirected to /login.
// Public API (/api/v1/*) is authenticated separately via API keys, so it's excluded.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/settings");

  if (isProtected && !req.auth) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  // Run on everything except static assets and the public API.
  matcher: ["/((?!api/v1|_next/static|_next/image|favicon.ico).*)"],
};
