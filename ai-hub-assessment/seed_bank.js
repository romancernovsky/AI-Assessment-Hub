const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const p = new PrismaClient();

async function seed() {
  try {
    const workbookPath = path.resolve(__dirname, '..', 'AI_Hub_Assessment_v2_Question_Bank.xlsx');
    console.log('Reading workbook from:', workbookPath);
    const wb = XLSX.readFile(workbookPath);

    // --- Parse Dimensions sheet ---
    const dimSheet = wb.Sheets['Dimensions'];
    if (!dimSheet) throw new Error('Missing "Dimensions" sheet');
    const dimRows = XLSX.utils.sheet_to_json(dimSheet);
    console.log(`Parsed ${dimRows.length} dimensions`);

    const dimensions = dimRows.map(r => ({
      key: r.key,
      name: r.name,
      weight: Number(r.weight),
      color: r.color || '#888',
      bg: r.bg || 'rgba(136,136,136,0.12)',
      icon: r.icon,
      short: r.short,
      focus: r.focus,
      target: r.target,
      developing: r.developing,
    }));

    // Validate weights sum to 1.0
    const weightSum = dimensions.reduce((s, d) => s + d.weight, 0);
    if (Math.abs(weightSum - 1.0) > 0.01) {
      throw new Error(`Dimension weights sum to ${weightSum}, expected 1.0`);
    }

    // --- Parse Competencies sheet ---
    const compSheet = wb.Sheets['Competencies'];
    if (!compSheet) throw new Error('Missing "Competencies" sheet');
    const compRows = XLSX.utils.sheet_to_json(compSheet);
    console.log(`Parsed ${compRows.length} competencies`);

    const competencies = compRows.map(r => ({
      code: r.code,
      name: r.name,
      level: r.level,
      dimension: r.dimension,
      guidance: r.guidance,
      toolHint: r.toolHint,
    }));

    // --- Parse Questions sheet ---
    const qSheet = wb.Sheets['Questions'];
    if (!qSheet) throw new Error('Missing "Questions" sheet');
    const qRows = XLSX.utils.sheet_to_json(qSheet);
    console.log(`Parsed ${qRows.length} questions`);

    const questions = qRows.map(r => ({
      id: r.id,
      status: r.status || 'active',
      dimension: r.dimension,
      level: r.level,
      competency: r.competency,
      title: r.title,
      scenario: r.scenario,
      format: r.format || 'single',
      selectCount: r.selectCount ? Number(r.selectCount) : null,
      optionA: r.optionA,
      optionB: r.optionB,
      optionC: r.optionC,
      optionD: r.optionD,
      scoreA: Number(r.scoreA),
      scoreB: Number(r.scoreB),
      scoreC: Number(r.scoreC),
      scoreD: Number(r.scoreD),
      correct: r.correct,
      rationale: r.rationale,
      antiGaming: r.antiGaming,
    }));

    const activeQuestions = questions.filter(q => q.status === 'active');
    console.log(`Active questions: ${activeQuestions.length}`);

    // Validate dimension references
    const dimKeys = new Set(dimensions.map(d => d.key));
    for (const q of questions) {
      if (!dimKeys.has(q.dimension)) {
        throw new Error(`Question ${q.id}: dimension '${q.dimension}' not found in Dimensions sheet`);
      }
    }

    // --- Clear existing bank versions and seed fresh ---
    console.log('Deleting existing bank versions...');
    // Delete reactions first (foreign key), then attempts, then bank versions
    await p.questionReaction.deleteMany({});
    await p.assessmentAttempt.deleteMany({});
    await p.bankVersion.deleteMany({});

    const version = await p.bankVersion.create({
      data: {
        status: 'live',
        publishedAt: new Date(),
        publishedBy: 'system-seed',
        questionCount: activeQuestions.length,
        dimensionConfig: dimensions,
        competencyConfig: competencies,
        questions: questions,
      }
    });

    console.log(`\nSeeded live bank version: ${version.versionId}`);
    console.log(`  Questions: ${activeQuestions.length} active`);
    console.log(`  Dimensions: ${dimensions.map(d => `${d.name} (${d.weight})`).join(', ')}`);
    console.log(`  Competencies: ${competencies.length}`);

    // Print per-dimension breakdown
    for (const dim of dimensions) {
      const dimQs = activeQuestions.filter(q => q.dimension === dim.key);
      const l1 = dimQs.filter(q => q.level === 'L1').length;
      const l2 = dimQs.filter(q => q.level === 'L2').length;
      console.log(`  ${dim.icon} ${dim.name}: ${dimQs.length} questions (L1: ${l1}, L2: ${l2}), weight: ${dim.weight}`);
    }

  } catch (e) {
    console.error('Seed failed:', e);
    process.exit(1);
  } finally {
    await p.$disconnect();
  }
}

seed();
