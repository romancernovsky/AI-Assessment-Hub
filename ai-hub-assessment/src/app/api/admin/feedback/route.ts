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

    let feedbacks: any[] = [];
    
    if ((prisma as any).feedback) {
      feedbacks = await prisma.feedback.findMany({
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
    } else {
      // Workaround for Prisma client caching issue in dev
      // We need to manually join with User table for details
      feedbacks = await (prisma as any).$queryRawUnsafe(`
        SELECT f.*, u."displayName" as "userDisplayName", u."email" as "userEmail", u."role" as "userRole"
        FROM "Feedback" f
        LEFT JOIN "User" u ON f."userId" = u."userId"
        ORDER BY f."createdAt" DESC
      `);
    }

    // Format for the UI
    const formattedFeedbacks = feedbacks.map((f: any) => ({
      id: f.feedbackId,
      userName: f.user?.displayName || f.userDisplayName || f.name || 'Anonymous',
      userEmail: f.user?.email || f.userEmail || f.email || 'N/A',
      userRole: f.user?.role || f.userRole || 'visitor',
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
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}
