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
    // Get the most recent completed (non-deleted) attempt for this user
    const attempt = await prisma.assessmentAttempt.findFirst({
      where: {
        userId: session.user.id,
        status: 'completed',
      },
      orderBy: { startTime: 'desc' }
    });

    if (!attempt) {
      return NextResponse.json({ message: 'No completed assessment found' }, { status: 404 });
    }

    // Get the bank version for content assembly
    const bankVersion = await prisma.bankVersion.findUnique({
      where: { versionId: attempt.bankVersionId }
    });

    if (!bankVersion) {
      return NextResponse.json({ message: 'Bank version not found' }, { status: 500 });
    }

    const allQuestions = (bankVersion.questions as any[]).filter((q: any) => q.status === 'active');
    const selectedIds = attempt.selectedQuestionIds as string[];
    // Return only the questions that were selected for this attempt
    const questions = selectedIds && selectedIds.length > 0
      ? allQuestions.filter((q: any) => selectedIds.includes(q.id))
      : allQuestions;
    const dimensions = bankVersion.dimensionConfig as any[];
    const competencies = bankVersion.competencyConfig as any[];
    const answers = attempt.answers as Record<string, any>;

    // Calculate completion time in minutes
    const completionTime = attempt.endTime && attempt.startTime
      ? Math.round((new Date(attempt.endTime).getTime() - new Date(attempt.startTime).getTime()) / 60000)
      : null;

    // Calculate when they can retake (30 days from completion)
    const lockExpiresAt = attempt.endTime 
      ? new Date(new Date(attempt.endTime).getTime() + 30 * 24 * 60 * 60 * 1000)
      : null;

    return NextResponse.json({
      attemptId: attempt.attemptId,
      overallScore: attempt.overallScore,
      dimScores: attempt.dimScores,
      badge: attempt.badge,
      badgeExpiresAt: attempt.badgeExpiresAt,
      completionTime,
      lockExpiresAt: lockExpiresAt?.toISOString(),
      answers,
      questions,
      dimensions,
      competencies,
      bankVersionId: bankVersion.versionId,
      bankVersionDescription: bankVersion.description,
    }, { status: 200 });

  } catch (error) {
    console.error('Results fetch error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
