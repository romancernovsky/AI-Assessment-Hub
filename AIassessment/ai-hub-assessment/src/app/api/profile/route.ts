import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Fetch current user profile
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { userId: session.user.id },
      select: {
        userId: true,
        email: true,
        displayName: true,
        role: true,
        externalId: true,
        isActive: true,
        registeredAt: true,
        lastLoginAt: true,
      }
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Update user profile
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { displayName, email } = await req.json();

    // Validate
    if (!displayName || !displayName.trim()) {
      return NextResponse.json({ message: 'Display name is required' }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    // Check if email is taken by another user
    if (email !== session.user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.userId !== session.user.id) {
        return NextResponse.json({ message: 'Email is already in use by another account' }, { status: 409 });
      }
    }

    const updated = await prisma.user.update({
      where: { userId: session.user.id },
      data: {
        displayName: displayName.trim(),
        email: email.trim(),
      },
      select: {
        userId: true,
        email: true,
        displayName: true,
        role: true,
        externalId: true,
        isActive: true,
        registeredAt: true,
        lastLoginAt: true,
      }
    });

    // If email changed, tell client to re-authenticate so JWT reflects new email
    const emailChanged = email.trim() !== session.user.email;

    return NextResponse.json({
      message: 'Profile updated',
      user: updated,
      requireReauth: emailChanged,
    }, { status: 200 });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
