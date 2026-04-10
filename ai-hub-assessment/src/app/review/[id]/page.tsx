import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ReviewClient from "./ReviewClient";

export default async function ReviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ mode?: string }> }) {
  const { id } = await params;
  const { mode } = await searchParams;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { attemptId: id },
    include: {
      bankVersion: true,
      reactions: true,
    }
  });

  if (!attempt || attempt.userId !== session.user.id) {
    redirect('/dashboard');
  }

  if (attempt.status !== 'completed') {
    redirect(`/assessment/${attempt.attemptId}`);
  }

  const questions = attempt.bankVersion.questions as any;
  const answers = attempt.answers as any;
  const feedbackMode = mode === 'feedback';

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <ReviewClient 
        attempt={attempt as any} 
        questions={questions} 
        answers={answers} 
        reactions={attempt.reactions as any}
        feedbackMode={feedbackMode}
      />
    </div>
  );
}
