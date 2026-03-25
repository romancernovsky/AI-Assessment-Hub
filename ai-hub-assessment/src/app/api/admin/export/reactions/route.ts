import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'contentAdmin')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const reactions = await prisma.questionReaction.findMany({
      include: {
        attempt: {
          include: {
            user: true,
            bankVersion: {
              select: {
                description: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const headers = ['Reaction ID', 'User Email', 'Attempt ID', 'Bank Version ID', 'Bank Version Description', 'Question ID', 'Reaction Vote', 'Comment', 'Timestamp'];
    const rows = reactions.map((r: any) => [
      r.reactionId,
      r.attempt.user.email,
      r.attemptId,
      r.attempt.bankVersionId,
      r.attempt.bankVersion?.description || '',
      r.questionId,
      r.vote || '',
      r.comment || '',
      r.createdAt.toISOString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((r: any) => r.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="question_reactions.csv"'
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
