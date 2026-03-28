import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';



export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'contentAdmin')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string | undefined;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuf = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuf as any);

    // Ensure all three sheets exist
    const requiredSheets = ['Questions', 'Dimensions', 'Competencies'];
    const sheetNames = workbook.worksheets.map(ws => ws.name);
    for (const sheet of requiredSheets) {
      if (!sheetNames.includes(sheet)) {
        return NextResponse.json({ message: `Missing sheet: ${sheet}` }, { status: 400 });
      }
    }

    // Helper: convert ExcelJS worksheet to array of objects (like xlsx.utils.sheet_to_json)
    function sheetToJson(worksheet: ExcelJS.Worksheet): any[] {
      const rows: any[] = [];
      const headers: string[] = [];
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber] = String(cell.value ?? '').trim();
      });
      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        const obj: any = {};
        let hasValue = false;
        headers.forEach((header, colNumber) => {
          if (!header) return;
          const val = row.getCell(colNumber).value;
          if (val !== null && val !== undefined) {
            obj[header] = typeof val === 'object' && 'result' in (val as any) ? (val as any).result : val;
            hasValue = true;
          }
        });
        if (hasValue) rows.push(obj);
      }
      return rows;
    }

    // Parse the data
    const questions: any[] = sheetToJson(workbook.getWorksheet('Questions')!);
    const dimensions: any[] = sheetToJson(workbook.getWorksheet('Dimensions')!);
    const competencies: any[] = sheetToJson(workbook.getWorksheet('Competencies')!);

    const activeQuestions = questions.filter(q => q.status === 'active');
    if (activeQuestions.length === 0) {
      return NextResponse.json({ message: 'Validation Failed: No active questions found.' }, { status: 400 });
    }

    // Extensive Validation logic
    const errors: string[] = [];
    const questionIds = new Set();
    const validFormats = new Set(['single', 'multi']);
    const validCorrect = new Set(['A', 'B', 'C', 'D']);
    const dimKeys = new Set(dimensions.map((d: any) => d.key));
    
    activeQuestions.forEach((q, idx) => {
      const row = `Row ${idx + 2}`;
      // Missing vital fields
      if (!q.id) errors.push(`${row}: Missing Question ID`);
      if (!q.title) errors.push(`${row} (${q.id}): Missing title`);
      if (!q.scenario) errors.push(`${row} (${q.id}): Missing scenario`);
      
      // Duplicate IDs
      if (questionIds.has(q.id)) {
        errors.push(`Duplicate Question ID found: ${q.id}`);
      }
      if (q.id) questionIds.add(q.id);

      // Dimension and competency
      if (!q.dimension) errors.push(`${q.id}: Missing dimension`);
      else if (!dimKeys.has(q.dimension)) errors.push(`${q.id}: Unknown dimension '${q.dimension}'`);
      if (!q.competency) errors.push(`${q.id}: Missing competency mapping`);
      if (!q.level) errors.push(`${q.id}: Missing level`);

      // Options — at least 2 must be provided
      const optionCount = [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean).length;
      if (optionCount < 2) errors.push(`${q.id}: Must have at least 2 options (optionA-D)`);

      // Scores must be numbers
      ['scoreA', 'scoreB', 'scoreC', 'scoreD'].forEach(s => {
        if (q[s] !== undefined && q[s] !== '' && isNaN(Number(q[s]))) {
          errors.push(`${q.id}: ${s} must be a number`);
        }
      });

      // Correct answer — single letter for single-select, comma-separated for multi-select
      const isMulti = q.selectCount && Number(q.selectCount) >= 2;
      if (!q.correct) {
        errors.push(`${q.id}: Missing correct answer`);
      } else {
        const letters = String(q.correct).split(',').map((s: string) => s.trim().toUpperCase());
        const allValid = letters.every((l: string) => validCorrect.has(l));
        if (!allValid) errors.push(`${q.id}: correct must contain only A, B, C, or D (comma-separated for multi)`);
        if (isMulti && letters.length !== Number(q.selectCount)) {
          errors.push(`${q.id}: selectCount is ${q.selectCount} but correct has ${letters.length} answers`);
        }
      }

      // Format — auto-derive from selectCount if not set
      if (q.format && !validFormats.has(q.format)) errors.push(`${q.id}: format must be 'single' or 'multi'`);
    });

    if (errors.length > 0) {
       return NextResponse.json({ message: 'Validation Failed', errors }, { status: 400 });
    }

    // Return validated data without saving — user must explicitly publish
    return NextResponse.json({
      message: 'Validation passed. Review and publish when ready.',
      questionCount: activeQuestions.length,
      dimensionCount: dimensions.length,
      competencyCount: competencies.length,
      payload: {
        questions,
        dimensions,
        competencies,
        activeQuestionCount: activeQuestions.length,
      }
    }, { status: 200 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error processing workbook' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'contentAdmin')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { action, description, payload } = await req.json();

    if (action !== 'publish') {
       return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    if (!payload?.questions || !payload?.dimensions || !payload?.competencies) {
      return NextResponse.json({ message: 'Missing validated payload' }, { status: 400 });
    }

    // Archive the previous live version
    await prisma.bankVersion.updateMany({
      where: { status: 'live' },
      data: { status: 'archived' }
    });

    // Create and publish in one step — no draft saved
    const published = await prisma.bankVersion.create({
      data: {
        status: 'live',
        publishedBy: session.user.id,
        publishedAt: new Date(),
        description: description || null,
        questionCount: payload.activeQuestionCount,
        dimensionConfig: payload.dimensions,
        competencyConfig: payload.competencies,
        questions: payload.questions,
      }
    });

    return NextResponse.json({ message: 'Version published and live.', versionId: published.versionId }, { status: 200 });

  } catch (error) {
     console.error(error);
     return NextResponse.json({ message: 'Error publishing version' }, { status: 500 });
  }
}
