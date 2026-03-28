import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request });
  const path = request.nextUrl.pathname;

  // Admin routes require admin or contentAdmin role
  if (path.startsWith("/admin")) {
    if (!token || (token.role !== "admin" && token.role !== "contentAdmin")) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protected user routes require any authenticated token
  if (
    path.startsWith("/dashboard") ||
    path.startsWith("/assessment") ||
    path.startsWith("/results") ||
    path.startsWith("/review")
  ) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/assessment/:path*",
    "/results/:path*",
    "/review/:path*",
  ],
};
