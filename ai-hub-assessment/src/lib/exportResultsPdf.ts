import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DimScore {
  key: string;
  name: string;
  icon: string;
  score: number;
  weight: number;
  color: string;
}

interface LearningItem {
  title: string;
  dimName: string;
  level: string;
  userScore: number;
  userAnswer: string[];
  bestAnswer: string[];
  rationale: string;
  compName: string;
  compGuidance: string;
  compToolHint: string;
}

interface ExportData {
  overallScore: number;
  badge: string;
  completionTime: number | null;
  bankVersionId?: number;
  bankVersionDescription?: string;
  dimScoreEntries: DimScore[];
  strongest: DimScore;
  weakest: DimScore;
  learningPath: LearningItem[];
  dimensions: any[];
}

// Novartis brand colors
const COLORS = {
  orange: [255, 78, 0] as [number, number, number],
  dark: [22, 22, 22] as [number, number, number],
  white: [252, 252, 252] as [number, number, number],
  gray: [218, 218, 218] as [number, number, number],
  lightGray: [245, 245, 245] as [number, number, number],
  emerald: [52, 211, 153] as [number, number, number],
  amber: [245, 158, 11] as [number, number, number],
};

export function exportResultsPdf(data: ExportData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ── Header band ─────────────────────────────────────────
  doc.setFillColor(...COLORS.orange);
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('AI Assessment Results', margin, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, 28);

  if (data.bankVersionId) {
    const versionText = `Assessment Version: v${data.bankVersionId}${data.bankVersionDescription ? ` (${data.bankVersionDescription})` : ''}`;
    doc.text(versionText, margin, 34);
  }

  y = 48;

  // ── Overall Score ───────────────────────────────────────
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(42);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.overallScore}%`, margin, y + 14);
  const scoreTextWidth = doc.getTextWidth(`${data.overallScore}%`);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  const badgeX = margin + scoreTextWidth + 8;
  const badgeColor = data.badge === 'AI Enthusiast' ? COLORS.emerald : COLORS.amber;
  doc.setTextColor(...badgeColor);
  doc.text(data.badge, badgeX, y + 8);

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Completed in ${data.completionTime || '?'} minutes`, badgeX, y + 14);

  y += 24;

  // ── Dimension Profile ───────────────────────────────────
  doc.setDrawColor(...COLORS.gray);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('Dimension Profile', margin, y);
  y += 8;

  // Dimension bars
  for (const dim of data.dimScoreEntries) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text(dim.name, margin, y);

    const scoreText = `${dim.score}%`;
    doc.setFont('helvetica', 'normal');
    doc.text(scoreText, pageWidth - margin - doc.getTextWidth(scoreText), y);

    y += 3;

    // Background bar
    const barHeight = 4;
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(margin, y, contentWidth, barHeight, 1, 1, 'F');

    // Score bar
    const barColor = dim.score >= 80 ? COLORS.emerald : hexToRgb(dim.color);
    doc.setFillColor(...barColor);
    const barWidth = (dim.score / 100) * contentWidth;
    doc.roundedRect(margin, y, Math.max(barWidth, 2), barHeight, 1, 1, 'F');

    // 80% threshold marker
    const thresholdX = margin + 0.8 * contentWidth;
    doc.setDrawColor(180, 180, 180);
    doc.line(thresholdX, y, thresholdX, y + barHeight);

    y += barHeight + 6;
  }

  y += 4;

  // ── Strengths & Growth ──────────────────────────────────
  if (data.strongest && data.weakest && data.strongest.key !== data.weakest.key) {
    const boxWidth = (contentWidth - 6) / 2;
    const boxHeight = 22;

    // Strongest
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.roundedRect(margin, y, boxWidth, boxHeight, 2, 2, 'F');
    doc.setDrawColor(...COLORS.emerald);
    doc.roundedRect(margin, y, boxWidth, boxHeight, 2, 2, 'S');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(4, 120, 87);
    doc.text(`Strongest: ${data.strongest.name}`, margin + 4, y + 8);
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.dark);
    doc.text(`${data.strongest.score}%`, margin + 4, y + 17);

    // Weakest
    const rightX = margin + boxWidth + 6;
    doc.setFillColor(255, 251, 235); // amber-50
    doc.roundedRect(rightX, y, boxWidth, boxHeight, 2, 2, 'F');
    doc.setDrawColor(...COLORS.amber);
    doc.roundedRect(rightX, y, boxWidth, boxHeight, 2, 2, 'S');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(146, 64, 14);
    doc.text(`Growth Area: ${data.weakest.name}`, rightX + 4, y + 8);
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.dark);
    doc.text(`${data.weakest.score}%`, rightX + 4, y + 17);

    y += boxHeight + 8;
  }

  // ── Learning Path table ─────────────────────────────────
  if (data.learningPath.length > 0) {
    doc.setDrawColor(...COLORS.gray);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('Learning Path', margin, y);
    y += 4;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('Questions where you didn\'t score full marks, with guidance for improvement.', margin, y + 4);
    y += 8;

    const tableBody = data.learningPath.map((q) => [
      q.dimName,
      q.compName || '',
      q.title,
      q.level,
      `${Math.round(q.userScore * 100)}%`,
      truncate(q.rationale, 80),
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Dimension', 'Competency', 'Question', 'Level', 'Score', 'Why It Matters']],
      body: tableBody,
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        lineColor: [218, 218, 218],
        lineWidth: 0.2,
        textColor: COLORS.dark,
      },
      headStyles: {
        fillColor: COLORS.orange,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 30 },
        2: { cellWidth: 36 },
        3: { cellWidth: 14 },
        4: { cellWidth: 12 },
        5: { cellWidth: contentWidth - 24 - 30 - 36 - 14 - 12 },
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      didDrawPage: (hookData) => {
        // Footer on each page
        drawFooter(doc, pageWidth);
      },
    });

    // Detailed learning cards (new page)
    doc.addPage();
    y = margin;

    doc.setFillColor(...COLORS.dark);
    doc.rect(0, 0, pageWidth, 22, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Learning Path', margin, 14);
    y = 30;

    for (const q of data.learningPath) {
      // Check if we need a new page
      if (y > 250) {
        drawFooter(doc, pageWidth);
        doc.addPage();
        y = margin;
      }

      // Dimension + Level tag
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.orange);
      const tagParts = [q.dimName, q.compName, q.level, `${Math.round(q.userScore * 100)}%`].filter(Boolean);
      doc.text(tagParts.join('  ·  '), margin, y);
      y += 4;

      // Title
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.dark);
      const titleLines = doc.splitTextToSize(q.title, contentWidth);
      doc.text(titleLines, margin, y);
      y += titleLines.length * 4 + 2;

      // Your answer vs Best answer
      const colWidth = (contentWidth - 4) / 2;

      doc.setFillColor(254, 242, 242); // rose-50
      doc.roundedRect(margin, y, colWidth, 12, 1, 1, 'F');
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(190, 18, 60);
      doc.text('Your Answer', margin + 2, y + 3.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      const userAnsText = doc.splitTextToSize(q.userAnswer.join('; '), colWidth - 4);
      doc.text(userAnsText.slice(0, 2), margin + 2, y + 7);

      doc.setFillColor(236, 253, 245); // emerald-50
      doc.roundedRect(margin + colWidth + 4, y, colWidth, 12, 1, 1, 'F');
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(4, 120, 87);
      doc.text('Best Answer', margin + colWidth + 6, y + 3.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      const bestAnsText = doc.splitTextToSize(q.bestAnswer.join('; '), colWidth - 4);
      doc.text(bestAnsText.slice(0, 2), margin + colWidth + 6, y + 7);

      y += 14;

      // Rationale
      if (q.rationale) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.orange);
        doc.text('Why this matters: ', margin, y + 2);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        const rationaleLines = doc.splitTextToSize(q.rationale, contentWidth - 2);
        doc.text(rationaleLines.slice(0, 3), margin, y + 5);
        y += Math.min(rationaleLines.length, 3) * 3 + 5;
      }

      // Guidance
      if (q.compGuidance) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.dark);
        doc.text('The Principle: ', margin, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        const guideLines = doc.splitTextToSize(q.compGuidance, contentWidth - 2);
        doc.text(guideLines.slice(0, 2), margin, y + 3);
        y += Math.min(guideLines.length, 2) * 3 + 4;
      }

      // Divider
      doc.setDrawColor(230, 230, 230);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
    }
  }

  // Footer on last page
  drawFooter(doc, pageWidth);

  // Save
  const filename = `AI_Assessment_Results_${data.overallScore}pct_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

function drawFooter(doc: jsPDF, pageWidth: number) {
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 160, 160);
  doc.text('AI Hub Assessment — Confidential', 18, pageHeight - 8);
  doc.text(
    `Page ${(doc as any).internal.getCurrentPageInfo().pageNumber}`,
    pageWidth - 18 - doc.getTextWidth(`Page ${(doc as any).internal.getCurrentPageInfo().pageNumber}`),
    pageHeight - 8
  );
}

function truncate(str: string, len: number): string {
  if (!str) return '';
  return str.length > len ? str.slice(0, len - 1) + '…' : str;
}

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  const num = parseInt(cleaned, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}
