import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const authCookie = req.cookies.get("raiox-authenticated");
  const isAuthenticated = authCookie?.value === process.env.AUTH_PASSWORD;

  // Allow login page and auth API
  if (
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/api/auth")
  ) {
    if (isAuthenticated && req.nextUrl.pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Block everything else if not authenticated
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
