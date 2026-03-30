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
    const { questionId, vote, comment } = await req.json();

    if (!questionId) {
      return NextResponse.json({ message: 'Missing questionId' }, { status: 400 });
    }

    const { attemptId: requestedAttemptId } = await req.clone().json().catch(() => ({}));

    // Find the attempt — support both in-progress and completed attempts for feedback
    let currentAttempt;
    if (requestedAttemptId) {
      currentAttempt = await prisma.assessmentAttempt.findFirst({
        where: { userId: session.user.id, attemptId: requestedAttemptId, status: { in: ['in_progress', 'completed'] } },
      });
    } else {
      currentAttempt = await prisma.assessmentAttempt.findFirst({
        where: { userId: session.user.id, status: 'in_progress' },
        orderBy: { startTime: 'desc' }
      });
    }

    if (!currentAttempt) {
      return NextResponse.json({ message: 'No matching session' }, { status: 400 });
    }

    // Upsert reaction — update if exists for same attempt+question, create otherwise
    const existing = await prisma.questionReaction.findFirst({
      where: {
        attemptId: currentAttempt.attemptId,
        questionId,
      }
    });

    if (existing) {
      await prisma.questionReaction.update({
        where: { reactionId: existing.reactionId },
        data: {
          vote: vote ?? existing.vote,
          comment: comment ?? existing.comment,
        }
      });
    } else {
      await prisma.questionReaction.create({
        data: {
          attemptId: currentAttempt.attemptId,
          questionId,
          vote: vote || null,
          comment: comment || null,
        }
      });
    }

    return NextResponse.json({ message: 'Reaction saved' }, { status: 200 });

  } catch (error) {
    console.error('Reaction save error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
