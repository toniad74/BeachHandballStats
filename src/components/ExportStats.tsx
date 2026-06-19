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

  const { set1, set2, players, opponentName, shootoutRounds } = matchState;
  const ourTeamName = matchState.ourTeamName || 'Mi Equipo';

  // Stats
  let totalGoals1p = 0, totalGoals2p = 0, totalMissed = 0, totalTurnovers = 0;
  players.forEach(p => {
    totalGoals1p += p.goals1p;
    totalGoals2p += p.goals2p;
    totalMissed += p.missedShots;
    totalTurnovers += p.turnoverBadPass + p.turnoverSteps + p.turnoverFumbling;
  });
  const totalPoints = totalGoals1p + (totalGoals2p * 2);
  const totalShots = totalGoals1p + totalGoals2p + totalMissed;
  const effectiveness = totalShots > 0 ? ((totalGoals1p + totalGoals2p) / totalShots * 100) : 0;

  const locale = language === 'ca' ? 'ca-ES' : language === 'en' ? 'en-GB' : 'es-ES';
  const dateStr = new Date().toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });

  const exportPDF = () => {
    setExporting('pdf');
    try {
      const doc = new jsPDF();
      const title = `${ourTeamName} vs ${opponentName}`;

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('BeachHandball Stats', 105, 15, { align: 'center' });
      doc.setFontSize(14);
      doc.text(title, 105, 24, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(dateStr, 105, 31, { align: 'center' });

      // Score
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const scoreY = 42;
      doc.text(`Set 1: ${set1.usScore} - ${set1.themScore}`, 50, scoreY);
      doc.text(`Set 2: ${set2.usScore} - ${set2.themScore}`, 120, scoreY);
      if (shootoutRounds.some(r => r.usGoal !== null)) {
        const usShootout = shootoutRounds.filter(r => r.usGoal).length;
        const themShootout = shootoutRounds.filter(r => r.themGoal).length;
        doc.text(`Shootout: ${usShootout} - ${themShootout}`, 85, scoreY + 8);
      }

      // Summary stats
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const sumY = 58;
      doc.text(`${t.points}: ${totalPoints}  |  ${t.effectiveness}: ${effectiveness.toFixed(0)}%  |  ${t.turnovers}: ${totalTurnovers}`, 105, sumY, { align: 'center' });

      // Player table
      const headers = [
        ['#', t.player, t.position, t.goals1pt, t.goals2pt, t.points, t.missesLabel, t.losses, t.saves || 'Saves', t.recoveries]
      ];

      const rows = players.map(p => {
        const pts = p.goals1p + (p.goals2p * 2);
        const turnovers = p.turnoverBadPass + p.turnoverSteps + p.turnoverFumbling;
        return [
          p.number.toString(),
          p.name,
          translatePosition(p.position, t),
          p.goals1p.toString(),
          p.goals2p.toString(),
          pts.toString(),
          p.missedShots.toString(),
          turnovers.toString(),
          (p.saves || 0).toString(),
          (p.recoveries || 0).toString(),
        ];
      });

      autoTable(doc, {
        head: headers,
        body: rows,
        startY: 65,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      doc.save(`${ourTeamName}_vs_${opponentName}.pdf`);
    } catch (e) {
      console.error('PDF export failed:', e);
    }
    setExporting(null);
  };

  const exportExcel = () => {
    setExporting('excel');
    try {
      // Match summary sheet
      const summaryData = [
        ['BeachHandball Stats'],
        [`${ourTeamName} vs ${opponentName}`],
        [dateStr],
        [],
        ['', ourTeamName, opponentName],
        ['Set 1', set1.usScore, set1.themScore],
        ['Set 2', set2.usScore, set2.themScore],
      ];
      if (shootoutRounds.some(r => r.usGoal !== null)) {
        summaryData.push(['Shootout', shootoutRounds.filter(r => r.usGoal).length, shootoutRounds.filter(r => r.themGoal).length]);
      }
      summaryData.push([], [`${t.points}: ${totalPoints}`, `${t.effectiveness}: ${effectiveness.toFixed(0)}%`, `${t.turnovers}: ${totalTurnovers}`]);

      // Players sheet
      const playerHeaders = ['#', t.player, t.position, t.goals1pt, t.goals2pt, t.points, t.missesLabel, t.losses, t.saves || 'Saves', t.recoveries, 'Assists'];
      const playerRows = players.map(p => [
        p.number,
        p.name,
        translatePosition(p.position, t),
        p.goals1p,
        p.goals2p,
        p.goals1p + (p.goals2p * 2),
        p.missedShots,
        p.turnoverBadPass + p.turnoverSteps + p.turnoverFumbling,
        p.saves || 0,
        p.recoveries || 0,
        p.assists || 0,
      ]);

      const wb = XLSX.utils.book_new();
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      const wsPlayers = XLSX.utils.aoa_to_sheet([playerHeaders, ...playerRows]);

      XLSX.utils.book_append_sheet(wb, wsSummary, 'Match');
      XLSX.utils.book_append_sheet(wb, wsPlayers, 'Players');
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
