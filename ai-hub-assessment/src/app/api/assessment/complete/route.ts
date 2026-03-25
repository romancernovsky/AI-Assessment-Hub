import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const currentAttempt = await prisma.assessmentAttempt.findFirst({
      where: { userId: session.user.id, status: 'in_progress' },
      orderBy: { startTime: 'desc' }
    });

    if (!currentAttempt) {
      return NextResponse.json({ message: 'No active session' }, { status: 400 });
    }

    if (currentAttempt.status === 'completed') {
      return NextResponse.json({ message: 'Already completed' }, { status: 400 });
    }

    // Get bank version for scoring
    const bankVersion = await prisma.bankVersion.findUnique({
      where: { versionId: currentAttempt.bankVersionId }
    });

    if (!bankVersion) throw new Error('Bank Version unavailable');

    const questions = (bankVersion.questions as any[]).filter((q: any) => q.status === 'active');
    const dimensions = bankVersion.dimensionConfig as any[];
    const answers = currentAttempt.answers as Record<string, any>;

    // --- Calculate per-dimension scores ---
    const dimScores: Record<string, number> = {};

    for (const dim of dimensions) {
      const dimQuestions = questions.filter((q: any) => q.dimension === dim.key);
      if (dimQuestions.length === 0) {
        dimScores[dim.key] = 0;
        continue;
      }

      let totalScore = 0;
      for (const q of dimQuestions) {
        const answer = answers[q.id];
        if (answer) {
          totalScore += answer.score || 0;
        }
      }

      // Dimension score = (sum of question scores / number of questions) × 100
      dimScores[dim.key] = Math.round((totalScore / dimQuestions.length) * 100);
    }

    // --- Calculate weighted overall score ---
    let overallScore = 0;
    for (const dim of dimensions) {
      overallScore += (dimScores[dim.key] || 0) * dim.weight;
    }
    overallScore = Math.round(overallScore);

    // --- Badge assignment ---
    let badge: string;
    let badgeExpiresAt: Date | null = null;

    if (overallScore >= 80) {
      badge = 'AI Enthusiast';
      badgeExpiresAt = new Date();
      badgeExpiresAt.setMonth(badgeExpiresAt.getMonth() + 18);
    } else {
      badge = 'AI Explorer';
    }

    // --- Persist ---
    await prisma.assessmentAttempt.update({
      where: { attemptId: currentAttempt.attemptId },
      data: {
        status: 'completed',
        endTime: new Date(),
        overallScore,
        dimScores,
        badge,
        badgeExpiresAt,
      }
    });

    return NextResponse.json({
      message: 'Assessment completed',
      overallScore,
      dimScores,
      badge,
      badgeExpiresAt,
    }, { status: 200 });

  } catch (error) {
    console.error('Session complete error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
