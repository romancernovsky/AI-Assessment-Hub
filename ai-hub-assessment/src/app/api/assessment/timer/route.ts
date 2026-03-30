import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const TOTAL_TIME_SECONDS = 30 * 60; // 30 minutes

function computeElapsed(attempt: {
  timeUsedSeconds: number;
  isPaused: boolean;
  lastResumedAt: Date | null;
}): number {
  let elapsed = attempt.timeUsedSeconds;
  if (!attempt.isPaused && attempt.lastResumedAt) {
    const sinceResume = Math.floor(
      (Date.now() - attempt.lastResumedAt.getTime()) / 1000
    );
    elapsed += sinceResume;
  }
  return Math.min(elapsed, TOTAL_TIME_SECONDS);
}

/** GET — return current timer state */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const attempt = await prisma.assessmentAttempt.findFirst({
      where: { userId: session.user.id, status: 'in_progress' },
      orderBy: { startTime: 'desc' },
    });

    if (!attempt) {
      return NextResponse.json({ message: 'No active session' }, { status: 404 });
    }

    const elapsed = computeElapsed(attempt);
    const remaining = Math.max(TOTAL_TIME_SECONDS - elapsed, 0);

    return NextResponse.json({
      totalSeconds: TOTAL_TIME_SECONDS,
      elapsedSeconds: elapsed,
      remainingSeconds: remaining,
      isPaused: attempt.isPaused,
      expired: remaining <= 0,
    });
  } catch (error) {
    console.error('Timer GET error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST — manage timer lifecycle.
 *   action: "enter"   — user opened the assessment page, resume the clock
 *   action: "abandon" — user navigated away, delete the attempt
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action } = await req.json();
    if (!['enter', 'abandon'].includes(action)) {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    const attempt = await prisma.assessmentAttempt.findFirst({
      where: { userId: session.user.id, status: 'in_progress' },
      orderBy: { startTime: 'desc' },
    });

    if (!attempt) {
      return NextResponse.json({ message: 'No active session' }, { status: 404 });
    }

    const elapsed = computeElapsed(attempt);

    if (action === 'abandon') {
      await prisma.assessmentAttempt.update({
        where: { attemptId: attempt.attemptId },
        data: { status: 'deleted' },
      });
      return NextResponse.json({ message: 'Assessment abandoned' });
    }

    // action === 'enter'
    if (elapsed >= TOTAL_TIME_SECONDS) {
      return NextResponse.json({
        message: 'Time expired',
        expired: true,
        remainingSeconds: 0,
      });
    }

    if (attempt.isPaused) {
      await prisma.assessmentAttempt.update({
        where: { attemptId: attempt.attemptId },
        data: {
          isPaused: false,
          lastResumedAt: new Date(),
        },
      });
    }

    const remaining = Math.max(TOTAL_TIME_SECONDS - elapsed, 0);

    return NextResponse.json({
      totalSeconds: TOTAL_TIME_SECONDS,
      elapsedSeconds: elapsed,
      remainingSeconds: remaining,
      isPaused: false,
      expired: false,
    });
  } catch (error) {
    console.error('Timer POST error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
