import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Session, Athlete } from '@/store/session-store';
import type { Translations } from '@/lib/i18n';
import { getLeaderboardHeatLabel } from '@/lib/i18n';
import { DISCIPLINES } from '@/lib/constants';
import { formatValue, getAgeGroup } from '@/lib/utils';

/**
 * Generates and downloads a formatted A4 PDF results sheet for a session.
 * Entirely client-side — no network requests.
 */
export function exportSessionPdf(
  session: Session,
  athletes: Athlete[],
  disciplineLabel: (key: string) => string,
  t: Translations
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- Header ---
  const margin = 14;
  let y = 20;

  doc.setFontSize(18);
  doc.text(session.name, margin, y);
  y += 8;

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(session.date, margin, y);

  // Collect unique disciplines in session
  const disciplineKeys = [...new Set(session.heats.map((h) => h.disciplineType))];
  const disciplineNames = disciplineKeys.map((key) => disciplineLabel(key)).join(', ');
  if (disciplineNames) {
    doc.text(disciplineNames, margin, y + 6);
    y += 6;
  }

  doc.setTextColor(0);
  y += 10;

  // --- Build results table data ---
  // Group results by athlete, pick best per discipline, rank them
  const athleteMap = new Map(athletes.map((a) => [a.id, a]));

  interface RowData {
    athleteId: string;
    name: string;
    ageGroup: string;
    result: string;
    heat: string;
    discipline: string;
    sortValue: number;
    sortAscending: boolean;
  }

  const rows: RowData[] = [];

  for (const disciplineKey of disciplineKeys) {
    const config = DISCIPLINES[disciplineKey];
    const heats = session.heats.filter((h) => h.disciplineType === disciplineKey);

    // Collect best result per athlete for this discipline
    const bestByAthlete = new Map<string, { value: number; unit: 'ms' | 's' | 'cm' | 'm' | 'count'; heatId: string }>();

    for (const heat of heats) {
      for (const result of heat.results) {
        const current = bestByAthlete.get(result.athleteId);
        if (!current) {
          bestByAthlete.set(result.athleteId, {
            value: result.value,
            unit: result.unit,
            heatId: heat.id,
          });
        } else {
          const isBetter = config?.sortAscending ? result.value < current.value : result.value > current.value;
          if (isBetter) {
            bestByAthlete.set(result.athleteId, {
              value: result.value,
              unit: result.unit,
              heatId: heat.id,
            });
          }
        }
      }
    }

    // Skip disciplines where no session athlete has individual results (e.g. team games)
    const hasIndividualResults = session.athleteIds.some((id) => bestByAthlete.has(id));
    if (!hasIndividualResults && bestByAthlete.size > 0) continue;

    // Also include session athletes with no result for this discipline
    for (const athleteId of session.athleteIds) {
      const athlete = athleteMap.get(athleteId);
      const best = bestByAthlete.get(athleteId);
      const heatForAthlete = best ? heats.find((h) => h.id === best.heatId) : undefined;

      // Find heat index for label
      let heatLabel = '';
      if (heatForAthlete && heats.length > 1) {
        const idx = heats.indexOf(heatForAthlete);
        heatLabel = `${getLeaderboardHeatLabel(disciplineKey, t)} ${idx + 1}`;
      }

      rows.push({
        athleteId,
        name: athlete?.name ?? athleteId,
        ageGroup: athlete?.yearOfBirth ? getAgeGroup(athlete.yearOfBirth, new Date(session.date).getFullYear()) : '',
        result: best ? formatValue(best.value, best.unit) : '—',
        heat: heatLabel,
        discipline: disciplineLabel(disciplineKey),
        sortValue: best?.value ?? (config?.sortAscending ? Infinity : -Infinity),
        sortAscending: config?.sortAscending ?? true,
      });
    }
  }

  // Group by discipline
  const grouped = new Map<string, RowData[]>();
  for (const row of rows) {
    const existing = grouped.get(row.discipline) ?? [];
    existing.push(row);
    grouped.set(row.discipline, existing);
  }

  // --- Per-discipline tables with section headers ---
  const footerDrawer = (data: { settings: { margin: { left: number } } }) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`${t.pdfFooter} — ${new Date().toLocaleDateString()}`, data.settings.margin.left, pageHeight - 10);
    doc.text(`${doc.getCurrentPageInfo().pageNumber}`, pageWidth - margin, pageHeight - 10, {
      align: 'right',
    });
  };

  for (const [disciplineName, disciplineRows] of grouped) {
    // Section header
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y > pageHeight - 40) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(13);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'bold');
    doc.text(disciplineName, margin, y);
    doc.setFont('helvetica', 'normal');
    // Underline
    const textWidth = doc.getTextWidth(disciplineName);
    doc.setDrawColor(200);
    doc.line(margin, y + 1.5, margin + textWidth, y + 1.5);
    doc.setTextColor(0);
    y += 6;

    // Build table body for this discipline
    const sectionBody: string[][] = [];
    let sectionRank = 0;
    let prevValue: number | undefined;

    const asc = disciplineRows[0]?.sortAscending ?? true;
    disciplineRows.sort((a, b) => (asc ? a.sortValue - b.sortValue : b.sortValue - a.sortValue));

    for (let i = 0; i < disciplineRows.length; i++) {
      const row = disciplineRows[i];
      if (row.result === '—') {
        sectionBody.push(['—', row.name, row.ageGroup, row.result, row.heat]);
      } else {
        if (row.sortValue !== prevValue) {
          sectionRank = i + 1;
        }
        prevValue = row.sortValue;
        sectionBody.push([String(sectionRank), row.name, row.ageGroup, row.result, row.heat]);
      }
    }

    autoTable(doc, {
      startY: y,
      head: [[t.pdfRank, t.pdfName, t.pdfAgeGroup, t.pdfResult, t.pdfHeat]],
      body: sectionBody,
      margin: { left: margin, right: margin },
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [50, 50, 50] },
      didDrawPage: footerDrawer,
    });

    // Update y for next section
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (doc as any).lastAutoTable?.finalY as number | undefined;
    y = (finalY ?? y) + 10;
  }

  // --- Download ---
  const sanitized = session.name
    .replace(/[/\\:*?"<>|]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
  const filename = `trackly-${sanitized || 'session'}-${session.date}.pdf`;
  doc.save(filename);
}
