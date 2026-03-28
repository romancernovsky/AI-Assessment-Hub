import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'contentAdmin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const feedbacks = await prisma.feedback.findMany({
      include: {
        user: {
          select: {
            displayName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format for the UI
    const formattedFeedbacks = feedbacks.map((f: any) => ({
      id: f.feedbackId,
      userName: f.user?.displayName || f.name || 'Anonymous',
      userEmail: f.user?.email || f.email || 'N/A',
      userRole: f.user?.role || 'visitor',
      rating: f.rating,
      content: f.content,
      createdAt: f.createdAt,
    }));

    return NextResponse.json(formattedFeedbacks);
  } catch (error: any) {
    if (error?.code === 'P2021' && String(error?.meta?.table || '').includes('Feedback')) {
      console.warn('Admin feedback table is missing; returning empty feedback list.');
      return NextResponse.json([]);
    }

    console.error('Admin feedback fetch error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
