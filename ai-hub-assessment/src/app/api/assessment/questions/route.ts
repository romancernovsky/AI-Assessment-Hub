import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get the live bank version
    const bankVersion = await prisma.bankVersion.findFirst({
      where: { status: 'live' },
      orderBy: { versionId: 'desc' }
    });

    if (!bankVersion) {
      return NextResponse.json({ message: 'No live bank version available. Please ask an admin to import and publish a question bank.' }, { status: 400 });
    }

    const allQuestions: any[] = bankVersion.questions as any[];
    const dimensions: any[] = bankVersion.dimensionConfig as any[];
    const competencies: any[] = bankVersion.competencyConfig as any[];

    if (!Array.isArray(allQuestions) || allQuestions.length === 0) {
      return NextResponse.json({ message: 'No questions found in the bank version.' }, { status: 400 });
    }

    // Return ALL active questions (L1 + L2 combined in one assessment)
    const activeQuestions = allQuestions.filter((q: any) => q.status === 'active');

    // Map questions for the client
    const mappedQuestions = activeQuestions.map((q: any) => {
      // Build options array from optionA-D and scoreA-D
      const options = [
        { letter: 'A', text: q.optionA, score: q.scoreA },
        { letter: 'B', text: q.optionB, score: q.scoreB },
        { letter: 'C', text: q.optionC, score: q.scoreC },
        { letter: 'D', text: q.optionD, score: q.scoreD },
      ].filter(o => o.text);

      // Look up competency data
      const compCode = q.competency ? q.competency.split(',')[0].trim() : '';
      const comp = competencies.find((c: any) => c.code === compCode);

      // Look up dimension data
      const dim = dimensions.find((d: any) => d.key === q.dimension);

      return {
        id: q.id,
        title: q.title,
        scenario: q.scenario,
        dimension: q.dimension,
        dimensionName: dim?.name || q.dimension,
        dimensionIcon: dim?.icon || '',
        level: q.level,
        competency: compCode,
        competencyName: comp?.name || '',
        format: q.format || 'single',
        selectCount: q.selectCount || 1,
        options,
        rationale: q.rationale || '',
        correct: q.correct || '',
        // Competency-level content for feedback
        guidance: comp?.guidance || '',
        toolHint: comp?.toolHint || '',
      };
    });

    return NextResponse.json({
      questions: mappedQuestions,
      dimensions,
      competencies,
      bankVersionId: bankVersion.versionId,
    }, { status: 200 });

  } catch (error) {
    console.error('Questions fetch error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
