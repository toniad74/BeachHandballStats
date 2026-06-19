import React, { useRef, useState } from 'react';
import { MatchState, Player } from '../types';
import { Share2, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useI18n } from '../i18n';

interface ExportStatsProps {
  matchState: MatchState;
  sunMode: boolean;
}

export default function ExportStats({ matchState, sunMode }: ExportStatsProps) {
  const { t } = useI18n();
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const { set1, set2, players, opponentName, shootoutRounds } = matchState;
  const ourTeamName = matchState.ourTeamName || 'Mi Equipo';

  // Calculate stats
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

  // Top scorers
  const topScorers = [...players]
    .map(p => ({ ...p, pts: p.goals1p + (p.goals2p * 2) }))
    .filter(p => p.pts > 0)
    .sort((a, b) => b.pts - a.pts)
    .slice(0, 3);

  const exportAsImage = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#1e293b',
        scale: 2,
      });
      const dataUrl = canvas.toDataURL('image/png');

      // Try Web Share API first (mobile)
      if (navigator.share && navigator.canShare) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `${ourTeamName}_vs_${opponentName}.png`, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `${ourTeamName} vs ${opponentName}` });
          setExporting(false);
          return;
        }
      }

      // Fallback: download
      const link = document.createElement('a');
      link.download = `${ourTeamName}_vs_${opponentName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Export failed:', e);
    }
    setExporting(false);
  };

  return (
    <div className="space-y-4">
      {/* Export button */}
      <button
        onClick={exportAsImage}
        disabled={exporting}
        className={`w-full flex items-center justify-center gap-2 py-3 md:py-4 px-5 rounded-xl font-black text-sm md:text-base uppercase tracking-wider transition active:scale-95 ${sunMode
          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
          : 'bg-indigo-500 hover:bg-indigo-600 text-white'
        } disabled:opacity-50`}
      >
        {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
        {exporting ? t.saving : '📤 Exportar / Compartir'}
      </button>

      {/* Preview card (what gets exported) */}
      <div ref={cardRef} className="bg-slate-900 text-white p-6 rounded-2xl space-y-4 overflow-hidden">
        {/* Header */}
        <div className="text-center border-b border-slate-700 pb-4">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">BeachHandball Stats</p>
          <h2 className="text-2xl font-black uppercase mt-1">
            {ourTeamName} vs {opponentName}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>

        {/* Score */}
        <div className="flex justify-center items-center gap-6">
          <div className="text-center">
            <p className="text-[10px] uppercase text-slate-400 font-bold">Set 1</p>
            <p className="text-xl font-mono font-black">{set1.usScore} - {set1.themScore}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase text-slate-400 font-bold">Set 2</p>
            <p className="text-xl font-mono font-black">{set2.usScore} - {set2.themScore}</p>
          </div>
          {shootoutRounds.some(r => r.usGoal !== null) && (
            <div className="text-center">
              <p className="text-[10px] uppercase text-red-400 font-bold">Shootout</p>
              <p className="text-xl font-mono font-black">
                {shootoutRounds.filter(r => r.usGoal).length} - {shootoutRounds.filter(r => r.themGoal).length}
              </p>
            </div>
          )}
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-mono font-black text-emerald-400">{totalPoints}</p>
            <p className="text-[9px] uppercase text-slate-400 font-bold">{t.points}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-mono font-black text-amber-400">{effectiveness.toFixed(0)}%</p>
            <p className="text-[9px] uppercase text-slate-400 font-bold">{t.effectiveness}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-mono font-black text-red-400">{totalTurnovers}</p>
            <p className="text-[9px] uppercase text-slate-400 font-bold">{t.turnovers}</p>
          </div>
        </div>

        {/* Top Scorers */}
        {topScorers.length > 0 && (
          <div>
            <p className="text-[10px] uppercase text-slate-400 font-bold mb-2">⭐ Top Scorers</p>
            <div className="space-y-1.5">
              {topScorers.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                  <span className="text-sm font-bold">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} #{p.number} {p.name}
                  </span>
                  <span className="text-sm font-mono font-black text-emerald-400">{p.pts} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[9px] text-slate-500 pt-2 border-t border-slate-800">
          {t.copyright} • BeachHandball Stats 2026
        </p>
      </div>
    </div>
  );
}
