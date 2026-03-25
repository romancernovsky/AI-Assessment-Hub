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
    let errors: string[] = [];
    const questionIds = new Set();
    
    activeQuestions.forEach((q, idx) => {
      // Missing vital fields
      if (!q.id) errors.push(`Row ${idx + 2}: Missing Question ID`);
      if (!q.text) errors.push(`Row ${idx + 2} (${q.id}): Missing question body text`);
      
      // Duplicate IDs
      if (questionIds.has(q.id)) {
        errors.push(`Duplicate Question ID found: ${q.id}`);
      }
      if (q.id) questionIds.add(q.id);

      // Level 1 logic checks
      if (q.level === 1) {
        if (!q.options) errors.push(`${q.id}: Missing options JSON array string`);
        if (!q.correctOptionId) errors.push(`${q.id}: Missing correctOptionId`);
        if (!q.competency) errors.push(`${q.id}: Missing competency mapping`);
        if (!q.dimension) errors.push(`${q.id}: Missing dimension mapping`);
      }
      
      // Level 2 logic checks
      if (q.level === 2 && !q.rubric) {
        errors.push(`${q.id}: Level 2 tasks must provide a rubric guideline string`);
      }
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
