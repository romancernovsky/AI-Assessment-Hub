import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request, { params }: { params: { attemptId: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'contentAdmin')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    // Delete cascading reactions first
    await prisma.questionReaction.deleteMany({
      where: { attemptId: params.attemptId }
    });

    // Delete the attempt
    await prisma.assessmentAttempt.delete({
      where: { attemptId: params.attemptId }
    });

    return NextResponse.json({ message: 'Attempt deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error deleting attempt:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
