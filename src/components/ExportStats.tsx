import React, { useState } from 'react';
import { MatchState } from '../types';
import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useI18n } from '../i18n';
import { translatePosition } from '../utils/i18n';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ExportStatsProps {
  matchState: MatchState;
  sunMode: boolean;
}

export default function ExportStats({ matchState, sunMode }: ExportStatsProps) {
  const { t, language } = useI18n();
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);

  const { set1, set2, players, opponentName, shootoutRounds, historyEvents = [] } = matchState;
  const ourTeamName = matchState.ourTeamName || 'Mi Equipo';

  const locale = language === 'ca' ? 'ca-ES' : language === 'en' ? 'en-GB' : 'es-ES';
  const dateStr = new Date().toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  // Global stats
  let totalGoals1p = 0, totalGoals2p = 0, totalMissed = 0, totalMissedFlies = 0;
  let totalBadPass = 0, totalSteps = 0, totalFumbling = 0, totalRecoveries = 0, totalAssists = 0;
  let totalSaves = 0, totalConceded = 0;
  players.forEach(p => {
    totalGoals1p += p.goals1p;
    totalGoals2p += p.goals2p;
    totalMissed += p.missedShots;
    totalMissedFlies += p.missedFlies;
    totalBadPass += p.turnoverBadPass;
    totalSteps += p.turnoverSteps;
    totalFumbling += p.turnoverFumbling;
    totalRecoveries += (p.recoveries || 0);
    totalAssists += (p.assists || 0);
    totalSaves += (p.saves || 0);
    totalConceded += (p.goalsConceded || 0);
  });
  const totalPoints = totalGoals1p + (totalGoals2p * 2);
  const totalTurnovers = totalBadPass + totalSteps + totalFumbling;
  const totalShots = totalGoals1p + totalGoals2p + totalMissed;
  const effectiveness = totalShots > 0 ? ((totalGoals1p + totalGoals2p) / totalShots * 100) : 0;
  const flyAttempts = totalGoals2p + totalMissedFlies;
  const flyEff = flyAttempts > 0 ? (totalGoals2p / flyAttempts * 100) : 0;
  const gkEff = (totalSaves + totalConceded) > 0 ? (totalSaves / (totalSaves + totalConceded) * 100) : 0;

  // Shootout totals
  const usShootout = shootoutRounds.filter(r => r.usGoal).length;
  const themShootout = shootoutRounds.filter(r => r.themGoal).length;
  const hasShootout = shootoutRounds.some(r => r.usGoal !== null);

  // Top scorers
  const scorers = [...players].map(p => ({ ...p, pts: p.goals1p + (p.goals2p * 2) })).sort((a, b) => b.pts - a.pts);

  const exportPDF = () => {
    setExporting('pdf');
    try {
      const doc = new jsPDF();
      const title = `${ourTeamName} vs ${opponentName}`;
      let y = 12;

      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('BeachHandball Stats 2026', 105, y, { align: 'center' });
      y += 8;
      doc.setFontSize(13);
      doc.text(title, 105, y, { align: 'center' });
      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`${dateStr} - ${timeStr}`, 105, y, { align: 'center' });
      y += 10;

      // Results table
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('RESULTADO', 14, y);
      y += 2;
      const resultsData: string[][] = [
        ['Set 1', `${set1.usScore}`, `${set1.themScore}`],
        ['Set 2', `${set2.usScore}`, `${set2.themScore}`],
      ];
      if (hasShootout) resultsData.push(['Shootout', `${usShootout}`, `${themShootout}`]);
      resultsData.push(['TOTAL', `${set1.usScore + set2.usScore}`, `${set1.themScore + set2.themScore}`]);

      autoTable(doc, {
        head: [['', ourTeamName, opponentName]],
        body: resultsData,
        startY: y,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [30, 41, 59], fontStyle: 'bold' },
        theme: 'grid',
        tableWidth: 90,
        margin: { left: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      // Team stats summary
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('ESTADÍSTICAS DEL EQUIPO', 14, y);
      y += 2;
      autoTable(doc, {
        body: [
          [t.points, `${totalPoints}`, 'Goles 1pt', `${totalGoals1p}`],
          [t.effectiveness, `${effectiveness.toFixed(1)}%`, 'Goles 2pt', `${totalGoals2p}`],
          ['Fly %', `${flyEff.toFixed(1)}%`, t.missesLabel, `${totalMissed}`],
          ['GK %', `${gkEff.toFixed(1)}%`, 'Fly ' + t.missesLabel, `${totalMissedFlies}`],
          [t.turnovers, `${totalTurnovers}`, t.saves || 'Saves', `${totalSaves}`],
          [t.recoveries, `${totalRecoveries}`, 'Assists', `${totalAssists}`],
          [t.badPass, `${totalBadPass}`, t.steps, `${totalSteps}`],
          ['Fumble', `${totalFumbling}`, '', ''],
        ],
        startY: y,
        styles: { fontSize: 8, cellPadding: 2 },
        theme: 'plain',
        columnStyles: { 0: { fontStyle: 'bold' }, 2: { fontStyle: 'bold' } },
        margin: { left: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      // Individual player stats
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('RENDIMIENTO INDIVIDUAL', 14, y);
      y += 2;

      const playerHeaders = [['#', 'Nombre', 'Pos.', '1pt', '2pt', 'Pts', 'Asist.', 'Err', 'Fly Err', 'Pérd.', 'Recup.', 'Par.', 'Enc.', 'Excl.']];
      const playerRows = players.map(p => [
        p.number.toString(),
        p.name,
        translatePosition(p.position, t),
        p.goals1p.toString(),
        p.goals2p.toString(),
        (p.goals1p + p.goals2p * 2).toString(),
        (p.assists || 0).toString(),
        p.missedShots.toString(),
        p.missedFlies.toString(),
        (p.turnoverBadPass + p.turnoverSteps + p.turnoverFumbling).toString(),
        (p.recoveries || 0).toString(),
        (p.saves || 0).toString(),
        (p.goalsConceded || 0).toString(),
        p.exclusions.toString(),
      ]);

      autoTable(doc, {
        head: playerHeaders,
        body: playerRows,
        startY: y,
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', fontSize: 7 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      // Shootout detail (if played)
      if (hasShootout && y < 250) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('SHOOTOUT DETALLE', 14, y);
        y += 2;
        const shootoutRows = shootoutRounds.map((r, i) => {
          const shooter = players.find(p => p.id === r.usPlayerId);
          return [
            `${i + 1}`, 
            shooter?.name || '-',
            r.usGoal === true ? `+${r.usPoints || 2}` : r.usGoal === false ? 'X' : '-',
            r.themGoal === true ? `+${r.themPoints || 2}` : r.themGoal === false ? 'X' : '-',
          ];
        });
        autoTable(doc, {
          head: [['Ronda', 'Tirador', ourTeamName, opponentName]],
          body: shootoutRows,
          startY: y,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [127, 29, 29], fontStyle: 'bold' },
          theme: 'grid',
          tableWidth: 100,
          margin: { left: 14 },
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(`${t.copyright} • BeachHandball Stats 2026`, 105, 290, { align: 'center' });
      }

      doc.save(`${ourTeamName}_vs_${opponentName}.pdf`);
    } catch (e) {
      console.error('PDF export failed:', e);
    }
    setExporting(null);
  };

  const exportExcel = () => {
    setExporting('excel');
    try {
      const data: any[][] = [
        ['BeachHandball Stats 2026'],
        [`${ourTeamName} vs ${opponentName}`],
        [dateStr + ' - ' + timeStr],
        [],
        // Results
        ['RESULTADO', ourTeamName, opponentName],
        ['Set 1', set1.usScore, set1.themScore],
        ['Set 2', set2.usScore, set2.themScore],
      ];
      if (hasShootout) data.push(['Shootout', usShootout, themShootout]);
      data.push(['TOTAL', set1.usScore + set2.usScore, set1.themScore + set2.themScore]);
      data.push([]);

      // Team stats
      data.push(['ESTADÍSTICAS EQUIPO']);
      data.push([t.points, totalPoints, '', t.effectiveness, `${effectiveness.toFixed(1)}%`]);
      data.push(['Goles 1pt', totalGoals1p, '', 'Goles 2pt', totalGoals2p]);
      data.push(['Fly %', `${flyEff.toFixed(1)}%`, '', 'GK %', `${gkEff.toFixed(1)}%`]);
      data.push([t.turnovers, totalTurnovers, '', t.saves || 'Saves', totalSaves]);
      data.push([t.badPass, totalBadPass, '', t.steps, totalSteps]);
      data.push(['Fumble', totalFumbling, '', t.recoveries, totalRecoveries]);
      data.push([t.missesLabel, totalMissed, '', 'Fly ' + t.missesLabel, totalMissedFlies]);
      data.push(['Assists', totalAssists, '', 'Goles Enc.', totalConceded]);
      data.push([]);

      // Player table header
      data.push(['RENDIMIENTO INDIVIDUAL']);
      data.push(['#', 'Nombre', 'Posición', 'Goles 1pt', 'Goles 2pt', 'Puntos', 'Assists', 'Fallos', 'Fly Fallos', 'Mal Pase', 'Pasos', 'Fumble', 'Total Pérd.', 'Recup.', 'Paradas', 'Goles Enc.', '% Efect.', '% GK', 'Exclusiones']);
      players.forEach(p => {
        const pts = p.goals1p + (p.goals2p * 2);
        const turnovers = p.turnoverBadPass + p.turnoverSteps + p.turnoverFumbling;
        const pShots = p.goals1p + p.goals2p + p.missedShots;
        const pEff = pShots > 0 ? ((p.goals1p + p.goals2p) / pShots * 100) : 0;
        const pSaves = p.saves || 0;
        const pConc = p.goalsConceded || 0;
        const pGkEff = (pSaves + pConc) > 0 ? (pSaves / (pSaves + pConc) * 100) : 0;
        data.push([
          p.number, p.name, translatePosition(p.position, t),
          p.goals1p, p.goals2p, pts, p.assists || 0,
          p.missedShots, p.missedFlies,
          p.turnoverBadPass, p.turnoverSteps, p.turnoverFumbling, turnovers,
          p.recoveries || 0, pSaves, pConc,
          `${pEff.toFixed(0)}%`, pSaves + pConc > 0 ? `${pGkEff.toFixed(0)}%` : '-',
          p.exclusions,
        ]);
      });
      data.push([]);

      // Shootout detail
      if (hasShootout) {
        data.push(['SHOOTOUT DETALLE']);
        data.push(['Ronda', 'Tirador', `${ourTeamName} Resultado`, `${opponentName} Resultado`]);
        shootoutRounds.forEach((r, i) => {
          const shooter = players.find(p => p.id === r.usPlayerId);
          data.push([
            i + 1,
            shooter?.name || '-',
            r.usGoal === true ? `+${r.usPoints || 2}` : r.usGoal === false ? 'FALLO' : '-',
            r.themGoal === true ? `+${r.themPoints || 2}` : r.themGoal === false ? 'FALLO' : '-',
          ]);
        });
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);

      // Set column widths
      ws['!cols'] = [
        { wch: 8 }, { wch: 18 }, { wch: 14 },
        { wch: 9 }, { wch: 9 }, { wch: 8 }, { wch: 8 },
        { wch: 8 }, { wch: 10 }, { wch: 9 }, { wch: 8 },
        { wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 8 },
        { wch: 10 }, { wch: 9 }, { wch: 8 }, { wch: 10 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Match');
      XLSX.writeFile(wb, `${ourTeamName}_vs_${opponentName}.xlsx`);
    } catch (e) {
      console.error('Excel export failed:', e);
    }
    setExporting(null);
  };

  const pdfLabel = language === 'en' ? 'Export PDF' : language === 'ca' ? 'Exportar PDF' : 'Exportar PDF';
  const excelLabel = language === 'en' ? 'Export Excel' : language === 'ca' ? 'Exportar Excel' : 'Exportar Excel';

  return (
    <div className="flex gap-3">
      <button
        onClick={exportPDF}
        disabled={exporting !== null}
        className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-4 px-4 rounded-xl font-black text-sm md:text-base uppercase tracking-wider transition active:scale-95 disabled:opacity-50 ${sunMode
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'bg-red-500 hover:bg-red-600 text-white'
        }`}
      >
        {exporting === 'pdf' ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
        {pdfLabel}
      </button>
      <button
        onClick={exportExcel}
        disabled={exporting !== null}
        className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-4 px-4 rounded-xl font-black text-sm md:text-base uppercase tracking-wider transition active:scale-95 disabled:opacity-50 ${sunMode
          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
          : 'bg-emerald-500 hover:bg-emerald-600 text-white'
        }`}
      >
        {exporting === 'excel' ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5" />}
        {excelLabel}
      </button>
    </div>
  );
}
