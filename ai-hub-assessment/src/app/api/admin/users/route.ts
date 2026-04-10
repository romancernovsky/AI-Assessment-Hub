import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';



export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'contentAdmin')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get('role');

    const whereClause = roleFilter && roleFilter !== 'all' ? { role: roleFilter } : {};

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        userId: true,
        displayName: true,
        email: true,
        role: true,
        isActive: true,
        registeredAt: true,
        attempts: {
          select: { attemptId: true, endTime: true, overallScore: true },
          orderBy: { startTime: 'desc' },
          take: 1
        }
      },
      orderBy: { registeredAt: 'desc' }
    });

    const mappedUsers = users.map((user: any) => ({
      id: user.userId,
      name: user.displayName,
      email: user.email,
      role: user.role,
      status: user.isActive ? 'Active' : 'Inactive',
      joined: user.registeredAt,
      latestScore: (user.attempts.length > 0 && user.attempts[0].overallScore !== null) ? user.attempts[0].overallScore : 'N/A',
      latestAttemptId: user.attempts[0]?.attemptId || null,
      completed: !!user.attempts[0]?.endTime
    }));

    return NextResponse.json({ users: mappedUsers }, { status: 200 });

  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'contentAdmin')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { userId, role, isActive } = await req.json();

    if (!userId) {
      return NextResponse.json({ message: 'User ID required' }, { status: 400 });
    }

    // Prevent self-modification of role
    if (userId === session.user.id && role) {
      return NextResponse.json({ message: 'Cannot change your own role' }, { status: 403 });
    }

    // Validate role value
    const validRoles = ['admin', 'contentAdmin', 'user'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

    // Only admin can assign admin role or modify admin users
    if (session.user.role !== 'admin') {
      if (role === 'admin') {
        return NextResponse.json({ message: 'Only admins can assign admin role' }, { status: 403 });
      }
      const targetUser = await prisma.user.findUnique({ where: { userId }, select: { role: true } });
      if (targetUser?.role === 'admin') {
        return NextResponse.json({ message: 'Only admins can modify admin users' }, { status: 403 });
      }
    }

    const updateData: any = {};
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await prisma.user.update({
      where: { userId },
      data: updateData,
      select: { userId: true, role: true, isActive: true }
    });

    return NextResponse.json({ message: 'User updated', user: updatedUser }, { status: 200 });

  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized — only admins can delete users' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'User ID required' }, { status: 400 });
    }

    // Use a transaction to delete user and all related data
    await prisma.$transaction([
      // 1. Delete reactions associated with this user's attempts
      prisma.questionReaction.deleteMany({
        where: {
          attempt: {
            userId: userId
          }
        }
      }),
      // 2. Delete all attempts by this user
      prisma.assessmentAttempt.deleteMany({
        where: {
          userId: userId
        }
      }),
      // 3. Delete the user
      prisma.user.delete({
        where: {
          userId: userId
        }
      })
    ]);

    return NextResponse.json({ message: 'User and all associated data deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('User deletion error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized - only admins can create users' }, { status: 403 });
  }

  try {
    const { email, displayName, password, role } = await req.json();

    // Validate inputs
    if (!email || !displayName || !password) {
      return NextResponse.json({ message: 'Email, display name, and password are required' }, { status: 400 });
    }

    if (!['admin', 'contentAdmin'].includes(role)) {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ message: 'Email already in use' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        displayName,
        password: hashedPassword,
        role: role || 'contentAdmin',
        isActive: true
      },
      select: {
        userId: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        registeredAt: true
      }
    });

    return NextResponse.json({ message: 'User created successfully', user: newUser }, { status: 201 });

  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
