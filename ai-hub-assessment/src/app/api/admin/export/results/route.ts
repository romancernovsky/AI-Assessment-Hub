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
    const attempts = await prisma.assessmentAttempt.findMany({
      where: { status: 'completed' },
      include: { user: true },
      orderBy: { startTime: 'desc' }
    });

    if (attempts.length === 0) {
       return new NextResponse('Attempt ID,User Email,User Name,Status,Start Time,End Time,Overall Score', {
         status: 200,
         headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="assessment_results.csv"' }
       });
    }

    // Fetch unique bank versions to get dimension/competency names
    const versionIds = Array.from(new Set(attempts.map((a: any) => a.bankVersionId)));
    const bankVersions = await prisma.bankVersion.findMany({
      where: { versionId: { in: versionIds } },
      select: { versionId: true, dimensionConfig: true, competencyConfig: true, questions: true }
    });

    const versionMap = new Map(bankVersions.map((bv: any) => [bv.versionId, bv]));

    // Get union of all dimension/competency codes for headers
    const allDimKeys = Array.from(new Set(bankVersions.flatMap((bv: any) => (bv.dimensionConfig as any[]).map(d => d.key))));
    const allCompCodes = Array.from(new Set(bankVersions.flatMap((bv: any) => (bv.competencyConfig as any[]).map(c => c.code))));

    const headers = [
      'Attempt ID', 'User Email', 'User Name', 'Role', 'Status', 'Start Time', 'End Time', 'Overall Score',
      'Lock Expires At', 'Bank Version ID', 'Bank Version Description',
      ...allDimKeys.map(k => `${k} Score`),
      ...allCompCodes.map(c => `${c} Score`)
    ];

    const rows = attempts.map((a: any) => {
      const bv = versionMap.get(a.bankVersionId) as any;
      const dimScores = (a.dimScores as Record<string, number>) || {};
      
      // Calculate competency scores for this attempt on the fly
      const compScores: Record<string, string> = {};
      if (bv) {
        const questions = bv.questions as any[];
        const answers = a.answers as Record<string, any>;
        
        allCompCodes.forEach((code: any) => {
          const compQuestions = questions.filter((q: any) => q.competency === code && q.status === 'active');
          if (compQuestions.length > 0) {
            let total = 0;
            let count = 0;
            compQuestions.forEach((q: any) => {
              if (answers[q.id]) {
                total += answers[q.id].score || 0;
                count++;
              }
            });
            compScores[code as string] = count > 0 ? (total / count * 100).toFixed(2) : '';
          } else {
            compScores[code as string] = '';
          }
        });
      }

      const lockExpiresAt = a.endTime 
        ? new Date(a.endTime.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : '';

      return [
        a.attemptId,
        a.user.email,
        a.user.displayName,
        a.user.role,
        a.status,
        a.startTime.toISOString(),
        a.endTime ? a.endTime.toISOString() : '',
        a.overallScore !== null ? a.overallScore.toFixed(2) : '',
        lockExpiresAt,
        a.bankVersionId,
        bv ? bv.description || '' : '',
        ...allDimKeys.map((k: any) => dimScores[k as string] !== undefined ? dimScores[k as string].toFixed(2) : ''),
        ...allCompCodes.map((c: any) => compScores[c as string])
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((r: any) => r.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="assessment_results.csv"'
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
