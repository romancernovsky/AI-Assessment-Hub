import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { name, email, rating, content } = body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ message: 'Content is required' }, { status: 400 });
    }

    // Validate rating if provided
    const parsedRating = rating ? parseInt(rating) : null;
    if (parsedRating !== null && (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5)) {
      return NextResponse.json({ message: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId: session?.user?.id || null,
        name: name ? String(name).slice(0, 100) : null,
        email: email ? String(email).slice(0, 255) : null,
        rating: parsedRating,
        content: content.trim(),
      },
    });

    return NextResponse.json({ message: 'Feedback submitted successfully', feedbackId: feedback.feedbackId }, { status: 201 });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
