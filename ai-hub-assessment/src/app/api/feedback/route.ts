import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  let prismaKeys: string[] = [];
  let feedbackType: string = 'unknown';
  
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { name, email, rating, content } = body;
    
    prismaKeys = Object.keys(prisma);
    feedbackType = typeof (prisma as any).feedback;

    if (!content) {
      return NextResponse.json({ message: 'Content is required' }, { status: 400 });
    }

    let feedback;
    if ((prisma as any).feedback) {
      feedback = await prisma.feedback.create({
        data: {
          userId: session?.user?.id || null,
          name: name || null,
          email: email || null,
          rating: rating ? parseInt(rating) : null,
          content: content,
        },
      });
    } else {
      // Workaround for Prisma client caching issue in dev
      const feedbackId = `fb_${Date.now()}`;
      await (prisma as any).$executeRawUnsafe(
        `INSERT INTO "Feedback" ("feedbackId", "userId", "name", "email", "rating", "content", "createdAt") 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        feedbackId,
        session?.user?.id || null,
        name || null,
        email || null,
        rating ? parseInt(rating) : null,
        content
      );
      feedback = { feedbackId };
    }

    return NextResponse.json({ message: 'Feedback submitted successfully', feedbackId: feedback.feedbackId }, { status: 201 });
  } catch (error: any) {
    console.error('Feedback submission error detail:', error);
    return NextResponse.json({
      message: 'Internal Server Error',
      error: error.message
    }, { status: 500 });
  }
}
