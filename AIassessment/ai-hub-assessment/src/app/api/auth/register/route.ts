import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rateLimit';



export async function POST(req: Request) {
  try {
    // Rate limit: 5 registrations per 15 minutes per IP
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
    const { success } = rateLimit(`register:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
    if (!success) {
      return NextResponse.json({ message: 'Too many registration attempts. Please try again later.' }, { status: 429 });
    }

    const { email, password, displayName } = await req.json();

    if (!email || !password || !displayName) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
    }

    // Password strength: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit
    if (password.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters' }, { status: 400 });
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json({ message: 'Password must contain uppercase, lowercase, and a digit' }, { status: 400 });
    }

    // Sanitize display name
    const sanitizedDisplayName = displayName.trim().slice(0, 100);
    if (!sanitizedDisplayName) {
      return NextResponse.json({ message: 'Display name is required' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        displayName: sanitizedDisplayName,
        role: 'user'
      },
    });

    return NextResponse.json({ message: 'User created' }, { status: 201 });
  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
