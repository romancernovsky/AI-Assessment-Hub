import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as xlsx from 'xlsx';



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

    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: 'buffer' });

    // Ensure all three sheets exist
    const requiredSheets = ['Questions', 'Dimensions', 'Competencies'];
    for (const sheet of requiredSheets) {
      if (!workbook.SheetNames.includes(sheet)) {
        return NextResponse.json({ message: `Missing sheet: ${sheet}` }, { status: 400 });
      }
    }

    // Parse the data
    const questions: any[] = xlsx.utils.sheet_to_json(workbook.Sheets['Questions']);
    const dimensions: any[] = xlsx.utils.sheet_to_json(workbook.Sheets['Dimensions']);
    const competencies: any[] = xlsx.utils.sheet_to_json(workbook.Sheets['Competencies']);

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

    // Create the DRAFT version
    const newVersion = await prisma.bankVersion.create({
      data: {
        status: 'draft',
        publishedBy: session.user.id,
        description: description || null,
        questionCount: activeQuestions.length,
        dimensionConfig: dimensions,
        competencyConfig: competencies,
        questions: questions
      }
    });

    return NextResponse.json({
      message: 'Draft created successfully. Please review.',
      versionId: newVersion.versionId,
      questionCount: activeQuestions.length,
      dimensionCount: dimensions.length,
      competencyCount: competencies.length
    }, { status: 201 });

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
    const { versionId, action } = await req.json();

    if (action !== 'publish') {
       return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    // Archive the previous live version
    await prisma.bankVersion.updateMany({
      where: { status: 'live' },
      data: { status: 'archived' }
    });

    // Publish the draft
    const published = await prisma.bankVersion.update({
      where: { versionId },
      data: { status: 'live', publishedAt: new Date(), publishedBy: session.user.id }
    });

    return NextResponse.json({ message: 'Version published and live.', versionId: published.versionId }, { status: 200 });

  } catch (error) {
     console.error(error);
     return NextResponse.json({ message: 'Error publishing version' }, { status: 500 });
  }
}
