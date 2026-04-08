import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ versionId: string }> }
) {
  const { versionId: versionIdStr } = await params;
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'contentAdmin')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  const versionId = parseInt(versionIdStr);
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
    const wb = new ExcelJS.Workbook();

    // Helper: add JSON array as a sheet
    function addSheet(name: string, data: any[]) {
      const ws = wb.addWorksheet(name);
      if (data.length === 0) return;
      const headers = Object.keys(data[0]);
      ws.addRow(headers);
      data.forEach(item => ws.addRow(headers.map(h => item[h] ?? '')));
    }

    addSheet('Questions', version.questions as any[]);
    addSheet('Dimensions', version.dimensionConfig as any[]);
    addSheet('Competencies', version.competencyConfig as any[]);

    const buffer = await wb.xlsx.writeBuffer();

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
