import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Session, Athlete } from '@/store/session-store';
import type { Translations } from '@/lib/i18n';
import { getLeaderboardHeatLabel } from '@/lib/i18n';
import { DISCIPLINES } from '@/lib/constants';
import { formatValue, getAgeGroup } from '@/lib/utils';

/** Map MDI icon names to simple text/emoji fallbacks for PDF rendering. */
function iconToText(icon: string): string {
  const map: Record<string, string> = {
    'mdi:lightning-bolt': '\u26A1',
    'mdi:run-fast': '\uD83C\uDFC3',
    'mdi:run': '\uD83C\uDFC3',
    'mdi:fence': '\uD83D\uDEA7',
    'mdi:account-switch': '\uD83D\uDD04',
    'mdi:timer-sand': '\u23F3',
    'mdi:heart-pulse': '\u2764',
    'mdi:swap-horizontal': '\u21C4',
    'mdi:arrow-right-bold': '\u27A1',
    'mdi:arrow-up-bold': '\u2B06',
    'mdi:debug-step-over': '\u2933',
    'mdi:human-handsup': '\uD83D\uDE4C',
    'mdi:arrow-up-bold-circle': '\u2B06',
    'mdi:baseball': '\u26BE',
    'mdi:circle': '\u26AB',
    'mdi:baseball-bat': '\uD83C\uDFCF',
    'mdi:disc': '\uD83D\uDCBF',
    'mdi:arrow-top-right': '\u2197',
    'mdi:rocket-launch': '\uD83D\uDE80',
    'mdi:soccer': '\u26BD',
    'mdi:basketball': '\uD83C\uDFC0',
    'mdi:handball': '\uD83E\uDD3E',
    'mdi:hockey-sticks': '\uD83C\uDFD2',
    'mdi:volleyball': '\uD83C\uDFD0',
    'mdi:bullseye': '\uD83C\uDFAF',
    'mdi:fire': '\uD83D\uDD25',
    'mdi:rotate-right': '\uD83D\uDD04',
    'mdi:flag-variant': '\uD83C\uDFF4',
    'mdi:link-variant': '\uD83D\uDD17',
    'mdi:forest': '\uD83C\uDF32',
    'mdi:pencil-outline': '\u270F',
  };
  return map[icon] ?? '\u2022';
}

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
    // Find the discipline key for the icon fallback text
    const dKey = disciplineKeys.find((k) => disciplineLabel(k) === disciplineName);
    const icon = dKey ? (DISCIPLINES[dKey]?.icon ?? '') : '';
    // Use a text fallback for the icon (e.g. "mdi:lightning-bolt" → "⚡" mapped below)
    const iconText = icon ? `${iconToText(icon)}  ` : '';

    // Section header
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y > pageHeight - 40) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(13);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'bold');
    doc.text(`${iconText}${disciplineName}`, margin, y);
    doc.setFont('helvetica', 'normal');
    // Underline
    const textWidth = doc.getTextWidth(`${iconText}${disciplineName}`);
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
    .replace(/[^a-zA-Z0-9\u00C0-\u024F _-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
  const filename = `trackly-${sanitized}-${session.date}.pdf`;
  doc.save(filename);
}
