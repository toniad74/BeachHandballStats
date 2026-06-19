import React, { useRef, useState } from 'react';
import { MatchState } from '../types';
import { Share2, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useI18n } from '../i18n';
import { translatePosition } from '../utils/i18n';

interface ExportStatsProps {
  matchState: MatchState;
  sunMode: boolean;
}

export default function ExportStats({ matchState, sunMode }: ExportStatsProps) {
  const { t, language } = useI18n();
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

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

  const topScorers = [...players]
    .map(p => ({ ...p, pts: p.goals1p + (p.goals2p * 2) }))
    .filter(p => p.pts > 0)
    .sort((a, b) => b.pts - a.pts)
    .slice(0, 3);

  const locale = language === 'ca' ? 'ca-ES' : language === 'en' ? 'en-GB' : 'es-ES';

  const exportAsImage = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    setError('');

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#1e293b',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });

      if (!blob) {
        throw new Error('Failed to create image');
      }

      const fileName = `${ourTeamName}_vs_${opponentName}.png`;

      // Try Web Share API (works on mobile)
      if (navigator.share) {
        try {
          const file = new File([blob], fileName, { type: 'image/png' });
          await navigator.share({ files: [file] });
          setExporting(false);
          return;
        } catch (shareErr: any) {
          // User cancelled or share not supported for files — fallback to download
          if (shareErr.name === 'AbortError') {
            setExporting(false);
            return;
          }
        }
      }

      // Fallback: download file
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error('Export failed:', e);
      setError(language === 'en' ? 'Export failed. Try again.' : language === 'ca' ? "Error en l'exportació." : 'Error al exportar.');
    }
    setExporting(false);
  };

  const exportLabel = language === 'en' ? 'Export / Share' : language === 'ca' ? 'Exportar / Compartir' : 'Exportar / Compartir';
  const topLabel = language === 'en' ? 'Top Scorers' : language === 'ca' ? 'Màxims Golejadors' : 'Máximos Goleadores';

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
        {exporting ? '...' : exportLabel}
      </button>

      {error && (
        <p className="text-red-500 text-sm font-bold text-center">{error}</p>
      )}

      {/* Preview card (exported as image) */}
      <div ref={cardRef} style={{ backgroundColor: '#1e293b', color: '#fff', padding: '24px', borderRadius: '16px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '1px solid #334155', paddingBottom: '16px', marginBottom: '16px' }}>
          <p style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>BeachHandball Stats</p>
          <h2 style={{ fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', marginTop: '4px' }}>
            {ourTeamName} vs {opponentName}
          </h2>
          <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            {new Date().toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>

        {/* Score */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>SET 1</p>
            <p style={{ fontSize: '20px', fontWeight: 900, fontFamily: 'monospace' }}>{set1.usScore} - {set1.themScore}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>SET 2</p>
            <p style={{ fontSize: '20px', fontWeight: 900, fontFamily: 'monospace' }}>{set2.usScore} - {set2.themScore}</p>
          </div>
          {shootoutRounds.some(r => r.usGoal !== null) && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#f87171', fontWeight: 700 }}>SHOOTOUT</p>
              <p style={{ fontSize: '20px', fontWeight: 900, fontFamily: 'monospace' }}>
                {shootoutRounds.filter(r => r.usGoal).length} - {shootoutRounds.filter(r => r.themGoal).length}
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
          <div style={{ backgroundColor: '#334155', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'monospace', color: '#34d399' }}>{totalPoints}</p>
            <p style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{t.points}</p>
          </div>
          <div style={{ backgroundColor: '#334155', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'monospace', color: '#fbbf24' }}>{effectiveness.toFixed(0)}%</p>
            <p style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{t.effectiveness}</p>
          </div>
          <div style={{ backgroundColor: '#334155', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'monospace', color: '#f87171' }}>{totalTurnovers}</p>
            <p style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{t.turnovers}</p>
          </div>
        </div>

        {/* Top Scorers */}
        {topScorers.length > 0 && (
          <div>
            <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>⭐ {topLabel}</p>
            {topScorers.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(51,65,85,0.5)', borderRadius: '8px', padding: '8px 12px', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} #{p.number} {p.name}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 900, fontFamily: 'monospace', color: '#34d399' }}>{p.pts} pts</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: '9px', color: '#64748b', marginTop: '12px', borderTop: '1px solid #1e293b', paddingTop: '8px' }}>
          {t.copyright} • BeachHandball Stats 2026
        </p>
      </div>
    </div>
  );
}
