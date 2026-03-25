import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { questionId, selected } = await req.json();

    if (!questionId || !selected) {
      return NextResponse.json({ message: 'Missing questionId or selected' }, { status: 400 });
    }

    const currentAttempt = await prisma.assessmentAttempt.findFirst({
      where: { userId: session.user.id, status: 'in_progress' },
      orderBy: { startTime: 'desc' }
    });

    if (!currentAttempt) {
      return NextResponse.json({ message: 'No active session' }, { status: 400 });
    }

    // Look up the question from the bank version to get scores
    const bankVersion = await prisma.bankVersion.findUnique({
      where: { versionId: currentAttempt.bankVersionId }
    });

    if (!bankVersion) {
      return NextResponse.json({ message: 'Bank version not found' }, { status: 400 });
    }

    const questions = bankVersion.questions as any[];
    const question = questions.find((q: any) => q.id === questionId);

    if (!question) {
      return NextResponse.json({ message: 'Question not found in bank' }, { status: 400 });
    }

    // Calculate score based on format
    let score = 0;
    const scoreMap: Record<string, number> = {
      'A': question.scoreA ?? 0,
      'B': question.scoreB ?? 0,
      'C': question.scoreC ?? 0,
      'D': question.scoreD ?? 0,
    };

    if (question.format === 'multi' && Array.isArray(selected)) {
      // Multi-select: score = sum of selected option scores / selectCount
      const selectCount = question.selectCount || selected.length;
      const sumScores = selected.reduce((sum: number, letter: string) => sum + (scoreMap[letter.toUpperCase()] || 0), 0);
      score = sumScores / selectCount;
    } else {
      // Single-select: score = score of selected option
      const letter = typeof selected === 'string' ? selected.toUpperCase() : selected;
      score = scoreMap[letter] || 0;
    }

    // Merge new answer into existing answers JSON
    const answers = (currentAttempt.answers as Record<string, any>) || {};
    answers[questionId] = {
      selected,
      score,
      timestamp: new Date().toISOString()
    };

    await prisma.assessmentAttempt.update({
      where: { attemptId: currentAttempt.attemptId },
      data: { answers }
    });

    return NextResponse.json({ message: 'Saved successfully', score }, { status: 200 });

  } catch (error) {
    console.error('Response submit error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
