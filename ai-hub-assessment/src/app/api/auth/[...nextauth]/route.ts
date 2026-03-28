import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";

const handler = NextAuth(authOptions);

// Wrap POST with rate limiting for login attempts
async function rateLimitedPost(req: Request, ctx: any) {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  const { success } = rateLimit(`login:${ip}`, { limit: 10, windowMs: 60 * 1000 });
  if (!success) {
    return NextResponse.json(
      { message: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    );
  }
  return handler(req, ctx);
}

export { handler as GET, rateLimitedPost as POST };
