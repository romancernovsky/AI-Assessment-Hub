import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const existingAttempt = await prisma.assessmentAttempt.findFirst({
      where: { userId: session.user.id },
      orderBy: { startTime: 'desc' }
    });

    if (!existingAttempt) {
      return NextResponse.json({ status: 'not_started' }, { status: 200 });
    }

    if (existingAttempt.status === 'completed') {
      const lockExpiresAt = existingAttempt.endTime 
        ? new Date(existingAttempt.endTime.getTime() + 30 * 24 * 60 * 60 * 1000)
        : null;
      const isLocked = lockExpiresAt ? lockExpiresAt > new Date() : false;

      return NextResponse.json({ 
        status: 'completed', 
        sessionId: existingAttempt.attemptId,
        lockExpiresAt: lockExpiresAt?.toISOString(),
        isLocked
      }, { status: 200 });
    }

    return NextResponse.json({ 
      status: 'in_progress', 
      currentLevel: 'level1', 
      sessionId: existingAttempt.attemptId
    }, { status: 200 });
    
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check for existing completed attempt and 30-day lock
    const lastAttempt = await prisma.assessmentAttempt.findFirst({
      where: { userId: session.user.id, status: 'completed' },
      orderBy: { endTime: 'desc' }
    });

    if (lastAttempt && lastAttempt.endTime) {
      const lockExpiresAt = new Date(lastAttempt.endTime.getTime() + 30 * 24 * 60 * 60 * 1000);
      if (lockExpiresAt > new Date()) {
        return NextResponse.json({ 
          message: 'Assessment is locked for 30 days',
          lockExpiresAt: lockExpiresAt.toISOString()
        }, { status: 403 });
      }
    }

    // Check if live bank version exists
    const bankVersion = await prisma.bankVersion.findFirst({
      where: { status: 'live' },
      orderBy: { versionId: 'desc' }
    });

    if (!bankVersion) {
      return NextResponse.json({ message: 'No live assessment bank available' }, { status: 400 });
    }

    // Start a new session
    const newAttempt = await prisma.assessmentAttempt.create({
      data: {
        userId: session.user.id,
        bankVersionId: bankVersion.versionId,
        status: 'in_progress',
      }
    });

    return NextResponse.json({
      status: 'in_progress',
      currentLevel: 'level1',
      sessionId: newAttempt.attemptId
    }, { status: 201 });
    
  } catch (error) {
    console.error('Session start error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
