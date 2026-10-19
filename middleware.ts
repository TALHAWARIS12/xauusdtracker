import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Protect /terminal route: user must be authenticated
  if (pathname.startsWith("/terminal")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", "/terminal");
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect /admin route: user must be authenticated and have ADMIN role
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", "/admin");
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/terminal", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/terminal/:path*", "/admin/:path*"],
};
