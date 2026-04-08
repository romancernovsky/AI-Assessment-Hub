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
    // 1. Fetch completed attempts with all necessary data
    const completedAttempts = await prisma.assessmentAttempt.findMany({
      where: { status: 'completed', overallScore: { not: null } },
      select: { dimScores: true, answers: true, bankVersionId: true }
    });

    // 1.5. Fetch all reactions up front to determine if we should return early
    const reactionsRaw = await prisma.questionReaction.findMany({
      select: { reactionId: true }
    });
 
    if (completedAttempts.length === 0 && reactionsRaw.length === 0) {
      return NextResponse.json({ heatmap: [], reactionSummary: [], topCompetencies: [], bottomCompetencies: [], detailedReactions: [] }, { status: 200 });
    }

    // 2. Fetch unique bank versions used in those attempts and reactions
    const attemptVersionIds = completedAttempts.map((a: any) => a.bankVersionId);
    
    // Also fetch versions for reactions even if attempts aren't completed
    const reactionAttempts = await prisma.questionReaction.findMany({
      select: { attempt: { select: { bankVersionId: true } } }
    });
    const reactionVersionIds = reactionAttempts.map((r: any) => r.attempt.bankVersionId);
    
    const versionIds = Array.from(new Set([...attemptVersionIds, ...reactionVersionIds]));
    
    const bankVersions = await prisma.bankVersion.findMany({
      where: { versionId: { in: versionIds } },
      select: { versionId: true, questions: true, competencyConfig: true, dimensionConfig: true }
    });

    const versionMap = new Map(bankVersions.map((bv: any) => [bv.versionId, bv]));
    const dimensionNameMap = new Map<string, string>();
    
    bankVersions.forEach((bv: any) => {
      const dimConfig = (bv as any).dimensionConfig as any[];
      if (Array.isArray(dimConfig)) {
        dimConfig.forEach(dim => {
          dimensionNameMap.set(dim.key, dim.name);
        });
      }
    });

    const dimensionTotals: Record<string, { sum: number; count: number }> = {};
    const competencyTotals: Record<string, { sum: number; count: number, name: string }> = {};
    
    completedAttempts.forEach((attempt: any) => {
      // Dimensions (Already stored as 0-100 in dimScores)
      const scores = attempt.dimScores as Record<string, number>;
      if (scores) {
        Object.entries(scores).forEach(([dim, score]) => {
          if (!dimensionTotals[dim]) dimensionTotals[dim] = { sum: 0, count: 0 };
          dimensionTotals[dim].sum += score;
          dimensionTotals[dim].count += 1;
        });
      }

      // Competencies (Need to calculate from answers)
      const bv = versionMap.get(attempt.bankVersionId);
      if (bv) {
        const questions = (bv as any).questions as any[];
        const compConfig = (bv as any).competencyConfig as any[];
        const answers = attempt.answers as Record<string, any>;

        compConfig.forEach(comp => {
          const compQuestions = questions.filter(q => q.competency === comp.code && q.status === 'active');
          if (compQuestions.length > 0) {
            let totalCompScore = 0;
            let answeredInComp = 0;
            compQuestions.forEach(q => {
              if (answers[q.id]) {
                totalCompScore += answers[q.id].score || 0;
                answeredInComp++;
              }
            });
            if (answeredInComp > 0) {
              const avgScore = totalCompScore / answeredInComp;
              if (!competencyTotals[comp.code]) {
                competencyTotals[comp.code] = { sum: 0, count: 0, name: comp.name };
              }
              competencyTotals[comp.code].sum += avgScore;
              competencyTotals[comp.code].count += 1;
            }
          }
        });
      }
    });

    const heatmap = Object.entries(dimensionTotals).map(([dim, data]) => ({
      dimension: dimensionNameMap.get(dim) || dim,
      average: Number((data.sum / data.count).toFixed(2)) // Already 0-100
    })).sort((a, b) => b.average - a.average);

    const compAverages = Object.entries(competencyTotals).map(([code, data]) => ({
      code,
      name: data.name,
      average: Number(((data.sum / data.count) * 100).toFixed(2)) // Converting 0-1 average to %
    }));

    const topCompetencies = [...compAverages].sort((a, b) => b.average - a.average).slice(0, 5);
    const bottomCompetencies = [...compAverages].sort((a, b) => a.average - b.average).slice(0, 5);

    // 2. Fetch detailed reactions list
    const reactions = await prisma.questionReaction.findMany({
      select: { 
        reactionId: true,
        questionId: true, 
        vote: true,
        comment: true,
        createdAt: true,
        attempt: {
          select: { 
            bankVersionId: true,
            user: { select: { displayName: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const reactionCounts: Record<string, { 
      likes: number; 
      dislikes: number; 
      comments: number;
      total: number; 
      competencyName: string;
      level: number | string;
    }> = {};

    const detailedReactions = reactions.map((r: any) => {
      const qId = r.questionId;
      let competencyName = 'Unknown';
      let level = '?' as number | string;

      // Find question details from the bank version used in this attempt
      const bv = versionMap.get(r.attempt.bankVersionId);
      if (bv) {
        const questions = (bv as any).questions as any[];
        const compConfig = (bv as any).competencyConfig as any[];
        const question = questions.find(q => q.id === qId);
        
        if (question) {
          level = question.level || '?';
          const comp = compConfig.find(c => c.code === question.competency);
          if (comp) {
            competencyName = comp.name;
          }
        }
      }

      // Maintain summary for the aggregated view if needed (optional)
      if (!reactionCounts[qId]) {
        reactionCounts[qId] = { likes: 0, dislikes: 0, comments: 0, total: 0, competencyName, level };
      }
      if (r.vote === 'up') reactionCounts[qId].likes++;
      else if (r.vote === 'down') reactionCounts[qId].dislikes++;
      if (r.comment && r.comment.trim() !== '') reactionCounts[qId].comments++;
      reactionCounts[qId].total++;

      return {
        id: r.reactionId,
        questionId: qId,
        userName: r.attempt.user?.displayName || 'Anonymous',
        vote: r.vote,
        comment: r.comment,
        createdAt: r.createdAt,
        competencyName,
        level
      };
    });

    const reactionSummary = Object.entries(reactionCounts).map(([qId, data]) => ({
      questionId: qId,
      total: data.total,
      likes: data.likes,
      dislikes: data.dislikes,
      comments: data.comments,
      competencyName: data.competencyName,
      level: data.level
    })).sort((a, b) => b.total - a.total);

    return NextResponse.json({
      heatmap,
      reactionSummary,
      detailedReactions,
      topCompetencies,
      bottomCompetencies
    }, { status: 200 });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
