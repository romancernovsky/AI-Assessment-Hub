import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as xlsx from 'xlsx';

export async function GET(
  req: Request,
  { params }: { params: { versionId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'contentAdmin')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  const versionId = parseInt(params.versionId);
  if (isNaN(versionId)) {
    return NextResponse.json({ message: 'Invalid version ID' }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'excel';

  try {
    const version = await prisma.bankVersion.findUnique({
      where: { versionId },
    });

    if (!version) {
      return NextResponse.json({ message: 'Version not found' }, { status: 404 });
    }

    if (format === 'json') {
      const data = {
        versionId: version.versionId,
        description: version.description,
        publishedAt: version.publishedAt,
        questions: version.questions,
        dimensionConfig: version.dimensionConfig,
        competencyConfig: version.competencyConfig,
      };

      return new NextResponse(JSON.stringify(data, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="bank_v${versionId}.json"`,
        },
      });
    }

    // Default to Excel
    const wb = xlsx.utils.book_new();
    
    // Create sheets from JSON data
    const questionsSheet = xlsx.utils.json_to_sheet(version.questions as any[]);
    const dimensionsSheet = xlsx.utils.json_to_sheet(version.dimensionConfig as any[]);
    const competenciesSheet = xlsx.utils.json_to_sheet(version.competencyConfig as any[]);

    xlsx.utils.book_append_sheet(wb, questionsSheet, 'Questions');
    xlsx.utils.book_append_sheet(wb, dimensionsSheet, 'Dimensions');
    xlsx.utils.book_append_sheet(wb, competenciesSheet, 'Competencies');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="bank_v${versionId}.xlsx"`,
      },
    });

  } catch (error) {
    console.error('Error exporting bank version:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
