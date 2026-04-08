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
      where: { userId: session.user.id, status: { in: ['in_progress', 'completed'] } },
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

    // --- Select 28 random questions following dimension weight distribution ---
    const TOTAL_QUESTIONS = 28;
    const allQuestions = bankVersion.questions as any[];
    const dimensions = bankVersion.dimensionConfig as any[];
    const activeQuestions = allQuestions.filter((q: any) => q.status === 'active');

    // Calculate per-dimension question counts based on weights
    const dimCounts = dimensions.map(dim => ({
      key: dim.key,
      target: Math.round(TOTAL_QUESTIONS * dim.weight),
      pool: activeQuestions.filter((q: any) => q.dimension === dim.key),
    }));

    // Adjust rounding so total is exactly TOTAL_QUESTIONS
    let totalAllocated = dimCounts.reduce((s, d) => s + d.target, 0);
    while (totalAllocated !== TOTAL_QUESTIONS) {
      // Sort by pool size desc so we add/remove from dimensions with largest pools
      const sorted = [...dimCounts].sort((a, b) => b.pool.length - a.pool.length);
      if (totalAllocated < TOTAL_QUESTIONS) {
        const candidate = sorted.find(d => d.target < d.pool.length);
        if (candidate) { candidate.target++; totalAllocated++; }
        else break;
      } else {
        const candidate = sorted.reverse().find(d => d.target > 1);
        if (candidate) { candidate.target--; totalAllocated--; }
        else break;
      }
    }

    // Fisher-Yates shuffle helper
    const shuffle = <T,>(arr: T[]): T[] => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    // Pick random questions per dimension
    const selectedQuestions: any[] = [];
    for (const dc of dimCounts) {
      const shuffled = shuffle(dc.pool);
      const picked = shuffled.slice(0, Math.min(dc.target, shuffled.length));
      selectedQuestions.push(...picked);
    }

    const selectedQuestionIds = shuffle(selectedQuestions).map((q: any) => q.id);

    // Start a new session with selected questions
    const newAttempt = await prisma.assessmentAttempt.create({
      data: {
        userId: session.user.id,
        bankVersionId: bankVersion.versionId,
        status: 'in_progress',
        selectedQuestionIds,
        lastResumedAt: new Date(),
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
