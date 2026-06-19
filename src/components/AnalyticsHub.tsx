import React, { useState } from 'react';
import { Player, MatchState, EventLog } from '../types';
import { Target, Shield, AlertTriangle, Play, Flame, BarChart3, Users, Award, ChevronDown } from 'lucide-react';
import { useI18n } from '../i18n';
import { translatePosition } from '../utils/i18n';
import ExportStats from './ExportStats';

interface AnalyticsHubProps {
  matchState: MatchState;
  sunMode: boolean;
}

export default function AnalyticsHub({ matchState, sunMode }: AnalyticsHubProps) {
  const { t, language } = useI18n();
  const { players, opponentName, historyEvents = [], set1, set2 } = matchState;

  // Global calculation of goals, misses, turnovers
  let totalGoals1p = 0;
  let totalGoals2p = 0;
  let totalMissedShots = 0;
  let totalMissedFlies = 0;
  
  let totalBadPasses = 0;
  let totalSteps = 0;
  let totalFumbling = 0;

  players.forEach((p) => {
    totalGoals1p += p.goals1p;
    totalGoals2p += p.goals2p;
    totalMissedShots += p.missedShots;
    totalMissedFlies += p.missedFlies;

    totalBadPasses += p.turnoverBadPass;
    totalSteps += p.turnoverSteps;
    totalFumbling += p.turnoverFumbling;
  });

  const totalPointsScored = (totalGoals1p * 1) + (totalGoals2p * 2);
  const totalShots = totalGoals1p + totalGoals2p + totalMissedShots;
  const shootingSuccessAcc = totalShots > 0 ? ((totalGoals1p + totalGoals2p) / totalShots) * 100 : 0;

  // Fly risk-return strategy calculation
  // Total flies registered. In 2p goals, let's assume a portion or approximate them as creative, 
  // but we can compute: Fly Acc = (totalGoals2p) / (totalGoals2p + totalMissedFlies) * 100
  // Or even more precisely, we display goals2p vs missedFlies
  const totalFlyAttempts = totalGoals2p + totalMissedFlies;
  const flySuccessRate = totalFlyAttempts > 0 ? (totalGoals2p / totalFlyAttempts) * 100 : 0;

  // Turnovers
  const totalTurnovers = totalBadPasses + totalSteps + totalFumbling;

  // Porteria saves & conceded
  // We can count goalkeeper saves by parsing historical logs of type 'save'
  const countOfSaves = historyEvents.filter((ev) => ev.type === 'save' && ev.description.includes('PARADA')).length;
  const opponentScore = set1.themScore + set2.themScore;
  const totalAttemptsOnOurGK = countOfSaves + opponentScore;
  const gkEfectividad = totalAttemptsOnOurGK > 0 ? (countOfSaves / totalAttemptsOnOurGK) * 100 : 0;

  // SVG parameters for charts
  const makeCircleGauge = (percent: number, strokeColor: string) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;
    return { radius, circumference, strokeDashoffset };
  };

  const gkGauge = makeCircleGauge(gkEfectividad, '#22c55e');
  const shotGauge = makeCircleGauge(shootingSuccessAcc, '#f59e0b');
  const flyGauge = makeCircleGauge(flySuccessRate, '#ef4444');

  // Sort helper: Portero, Especialista & Polivalente always first
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  const sortedPlayers = [...players].sort((a, b) => {
    // Porteros always first
    if (a.position === 'Portero' && b.position !== 'Portero') return -1;
    if (b.position === 'Portero' && a.position !== 'Portero') return 1;
    // Then sort by points (goals1p + goals2p*2) descending
    const ptsA = a.goals1p + (a.goals2p * 2);
    const ptsB = b.goals1p + (b.goals2p * 2);
    return ptsB - ptsA;
  });

  return (
    <div className="p-3 md:p-6 space-y-5 md:space-y-8">
      
      {/* SUMMARY BAR */}
      <div className="bg-background border-2 border-amber-500 rounded-2xl p-4 md:p-6 text-gray-900 dark:text-gray-100 flex flex-col items-stretch shadow-md gap-4 overflow-hidden" id="analytics_summary_banner">
        <div className="flex items-center gap-3">
          <Award className="w-8 h-8 md:w-12 md:h-12 text-amber-500 flex-shrink-0" />
          <div className="min-w-0">
            <h2 className="text-lg md:text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-gray-100 truncate">{t.coachStats}</h2>
            <p className="text-[10px] md:text-sm font-bold text-gray-500 dark:text-zinc-400 uppercase truncate">{t.realTimeMetrics}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 md:gap-4 bg-gray-100 dark:bg-zinc-800/50 py-3 px-3 md:px-6 rounded-xl border border-gray-200 dark:border-zinc-700">
          <div className="text-center min-w-0">
            <span className="block text-[9px] md:text-xs uppercase font-black text-gray-500 dark:text-zinc-400 truncate">{t.points}</span>
            <span className="text-2xl md:text-4xl font-mono font-black text-gray-900 dark:text-gray-100">{totalPointsScored}</span>
          </div>
          <div className="text-center border-l border-gray-200 dark:border-zinc-700 pl-2 md:pl-4 min-w-0">
            <span className="block text-[9px] md:text-xs uppercase font-black text-gray-500 dark:text-zinc-400 truncate">{t.effectiveness}</span>
            <span className="text-2xl md:text-4xl font-mono font-black text-gray-900 dark:text-gray-100">{shootingSuccessAcc.toFixed(0)}%</span>
          </div>
          <div className="text-center border-l border-gray-200 dark:border-zinc-700 pl-2 md:pl-4 min-w-0">
            <span className="block text-[9px] md:text-xs uppercase font-black text-gray-500 dark:text-zinc-400 truncate">{t.turnovers}</span>
            <span className="text-2xl md:text-4xl font-mono font-black text-gray-900 dark:text-gray-100">{totalTurnovers}</span>
          </div>
        </div>
      </div>

      {/* THREE CIRCULAR GAUGES FOR SUN-VISIBILITY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        
        {/* SHOT ACCURACY GAUGES */}
        <div className="bg-background border border-gray-200 dark:border-zinc-800 p-6 rounded-2xl shadow flex flex-col items-center justify-center text-center">
          <h4 className="text-sm font-black text-gray-700 dark:text-zinc-300 uppercase tracking-widest mb-4 flex items-center gap-1.5 justify-center">
            <Target className="w-4 h-4 text-amber-500" />
            Efectividad de Tiro
          </h4>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r={shotGauge.radius}
                className="stroke-zinc-100 dark:stroke-zinc-800"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r={shotGauge.radius}
                className="stroke-amber-500 transition-all duration-500"
                strokeWidth="12"
                strokeDasharray={shotGauge.circumference}
                strokeDashoffset={shotGauge.strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-mono font-black text-gray-900 dark:text-white">
                {shootingSuccessAcc.toFixed(0)}%
              </span>
              <span className="block text-[9px] text-zinc-500 uppercase font-bold">Acertados</span>
            </div>
          </div>
          <p className="mt-4 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            {totalGoals1p + totalGoals2p} de {totalShots} tiros intentados fueron gol.
          </p>
        </div>

        {/* FLY ACCURACY / RISK ADJUSTMENT */}
        <div className="bg-background border border-gray-200 dark:border-zinc-800 p-6 rounded-2xl shadow flex flex-col items-center justify-center text-center">
          <h4 className="text-sm font-black text-gray-700 dark:text-zinc-300 uppercase tracking-widest mb-4 flex items-center gap-1.5 justify-center">
            <Flame className="w-4 h-4 text-red-500 animate-pulse" />
            Efectividad de Fly
          </h4>

          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r={flyGauge.radius}
                className="stroke-zinc-100 dark:stroke-zinc-800"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r={flyGauge.radius}
                className="stroke-orange-500 transition-all duration-500"
                strokeWidth="12"
                strokeDasharray={flyGauge.circumference}
                strokeDashoffset={flyGauge.strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-mono font-black text-gray-900 dark:text-white">
                {flySuccessRate.toFixed(0)}%
              </span>
              <span className="block text-[9px] text-zinc-500 uppercase font-bold">Consensuado</span>
            </div>
          </div>
          <p className="mt-4 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            {totalGoals2p} Goles 2pt (Flys) vs {totalMissedFlies} Flys Fallados.
          </p>
        </div>

        {/* GOALKEEPER PERFORMANCE */}
        <div className="bg-background border border-gray-200 dark:border-zinc-800 p-6 rounded-2xl shadow flex flex-col items-center justify-center text-center">
          <h4 className="text-sm font-black text-gray-700 dark:text-zinc-300 uppercase tracking-widest mb-4 flex items-center gap-1.5 justify-center">
            <Shield className="w-4 h-4 text-green-600" />
            Efectividad Portería
          </h4>

          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r={gkGauge.radius}
                className="stroke-zinc-100 dark:stroke-zinc-800"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r={gkGauge.radius}
                className="stroke-green-600 transition-all duration-500"
                strokeWidth="12"
                strokeDasharray={gkGauge.circumference}
                strokeDashoffset={gkGauge.strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-mono font-black text-gray-900 dark:text-white">
                {gkEfectividad.toFixed(0)}%
              </span>
              <span className="block text-[9px] text-zinc-500 uppercase font-bold">Parados</span>
            </div>
          </div>
          <p className="mt-4 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            {countOfSaves} paradas de {totalAttemptsOnOurGK} tiros rivales.
          </p>
        </div>

      </div>

      {/* TURNOVERS BREAKDOWN AND SCORING MIX */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        
        {/* TURNOVERS DETAILS DETAIL */}
        <div className="bg-background border border-gray-200 dark:border-zinc-800 rounded-2xl shadow p-5">
          <h4 className="text-base font-black text-gray-900 dark:text-zinc-100 uppercase mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 font-bold" />
            Desglose de Pérdidas de Balón ({totalTurnovers})
          </h4>

          <div className="space-y-4">
            
            {/* BAD PASSES */}
            <div>
              <div className="flex justify-between text-sm font-bold mb-1">
                <span className="text-gray-700 dark:text-zinc-300">Pases Fallados</span>
                <span className="font-mono text-zinc-900 dark:text-white">{totalBadPasses}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-zinc-800 h-3.5 rounded-full overflow-hidden">
                <div
                  className="bg-orange-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalTurnovers > 0 ? (totalBadPasses / totalTurnovers) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* STEPS */}
            <div>
              <div className="flex justify-between text-sm font-bold mb-1">
                <span className="text-gray-705 dark:text-zinc-300">Pasos (Walking)</span>
                <span className="font-mono text-zinc-900 dark:text-white">{totalSteps}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-zinc-800 h-3.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalTurnovers > 0 ? (totalSteps / totalTurnovers) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* FUMBLING */}
            <div>
              <div className="flex justify-between text-sm font-bold mb-1">
                <span className="text-gray-705 dark:text-zinc-300">Fumbling / Pérdida del bote</span>
                <span className="font-mono text-zinc-900 dark:text-white">{totalFumbling}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-zinc-800 h-3.5 rounded-full overflow-hidden">
                <div
                  className="bg-yellow-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalTurnovers > 0 ? (totalFumbling / totalTurnovers) * 100 : 0}%` }}
                />
              </div>
            </div>

          </div>

        </div>

        {/* SHOT EFFECTIVENESS BY TYPE */}
        <div className="bg-background border border-gray-200 dark:border-zinc-800 rounded-2xl shadow p-5">
          <h4 className="text-base font-black text-gray-900 dark:text-zinc-100 uppercase mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            {language === 'en' ? 'Effectiveness by Shot Type' : language === 'ca' ? 'Efectivitat per Tipus de Tir' : 'Efectividad por Tipo de Lanzamiento'}
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Simple +1 */}
            {(() => {
              const totalMissedSimple = players.reduce((s, p) => s + p.missedShots - p.missedFlies - (p.missedSpins || 0) - (p.missedPenalties || 0), 0);
              const simpleAttempts = totalGoals1p + Math.max(0, totalMissedSimple);
              const simpleEff = simpleAttempts > 0 ? (totalGoals1p / simpleAttempts * 100) : 0;
              return (
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl text-center border border-blue-200 dark:border-blue-800/50">
                  <span className="text-xs uppercase text-blue-600 dark:text-blue-400 font-bold block mb-1">+1</span>
                  <span className="text-2xl md:text-3xl font-mono font-black text-blue-700 dark:text-blue-300">{simpleEff.toFixed(0)}%</span>
                  <span className="text-[10px] text-gray-500 dark:text-zinc-400 block mt-1">{totalGoals1p}/{simpleAttempts}</span>
                </div>
              );
            })()}
            {/* Fly */}
            {(() => {
              const flyAttempts2 = totalGoals2p + totalMissedFlies;
              const flyEff2 = flyAttempts2 > 0 ? (totalGoals2p / flyAttempts2 * 100) : 0;
              return (
                <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-xl text-center border border-orange-200 dark:border-orange-800/50">
                  <span className="text-xs uppercase text-orange-600 dark:text-orange-400 font-bold block mb-1">Fly</span>
                  <span className="text-2xl md:text-3xl font-mono font-black text-orange-700 dark:text-orange-300">{flyEff2.toFixed(0)}%</span>
                  <span className="text-[10px] text-gray-500 dark:text-zinc-400 block mt-1">{totalGoals2p}/{flyAttempts2}</span>
                </div>
              );
            })()}
            {/* Giro */}
            {(() => {
              const totalMissedSpins = players.reduce((s, p) => s + (p.missedSpins || 0), 0);
              const goalsGiro = players.reduce((s, p) => s + p.goals2p, 0); // approximate - giros are part of goals2p
              const giroAttempts = totalMissedSpins; // we only know missed giros for now
              const giroTotal = giroAttempts; // display missed count
              return (
                <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-xl text-center border border-purple-200 dark:border-purple-800/50">
                  <span className="text-xs uppercase text-purple-600 dark:text-purple-400 font-bold block mb-1">{language === 'en' ? 'Spin' : 'Giro'}</span>
                  <span className="text-2xl md:text-3xl font-mono font-black text-purple-700 dark:text-purple-300">{totalMissedSpins}</span>
                  <span className="text-[10px] text-gray-500 dark:text-zinc-400 block mt-1">{language === 'en' ? 'missed' : language === 'ca' ? 'fallats' : 'fallados'}</span>
                </div>
              );
            })()}
            {/* Penalti */}
            {(() => {
              const totalMissedPens = players.reduce((s, p) => s + (p.missedPenalties || 0), 0);
              return (
                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-xl text-center border border-red-200 dark:border-red-800/50">
                  <span className="text-xs uppercase text-red-600 dark:text-red-400 font-bold block mb-1">{language === 'en' ? 'Penalty' : 'Penalti'}</span>
                  <span className="text-2xl md:text-3xl font-mono font-black text-red-700 dark:text-red-300">{totalMissedPens}</span>
                  <span className="text-[10px] text-gray-500 dark:text-zinc-400 block mt-1">{language === 'en' ? 'missed' : language === 'ca' ? 'fallats' : 'fallados'}</span>
                </div>
              );
            })()}
          </div>
        </div>

      </div>


      {/* RENDIMIENTO INDIVIDUAL - FICHAS EXPANDIBLES */}
      <div className="bg-background border-2 border-gray-200 dark:border-zinc-800 rounded-2xl shadow p-4 md:p-6 overflow-hidden">
        <h4 className="text-lg md:text-xl font-black text-gray-900 dark:text-zinc-100 uppercase mb-5 flex items-center gap-2">
          <Users className="w-6 h-6 md:w-7 md:h-7 text-amber-500" />
          Rendimiento Individual
        </h4>

        <div className="space-y-3">
          {sortedPlayers.map((p) => {
            const pTurnovers = p.turnoverBadPass + p.turnoverSteps + p.turnoverFumbling;
            const pSaves = Math.max(p.saves || 0, historyEvents.filter((ev) => ev.type === 'save' && ev.description.includes('PARADA') && ev.description.includes(p.name)).length);
            const pTotalGoals = p.goals1p + p.goals2p;
            const pTotalPoints = p.goals1p + (p.goals2p * 2);
            const pTotalShots = pTotalGoals + p.missedShots;
            const pEffectiveness = pTotalShots > 0 ? (pTotalGoals / pTotalShots) * 100 : 0;
            const isGKType = p.position === 'Portero' || p.position === 'Especialista' || p.position === 'Polivalente';
            const pGoalsConceded = p.goalsConceded || 0;
            const pGKTotal = pSaves + pGoalsConceded;
            const pSavePercentage = pGKTotal > 0 ? (pSaves / pGKTotal) * 100 : 0;
            const isExpanded = expandedPlayerId === p.id;

            return (
              <div key={p.id} className={`border-2 rounded-2xl overflow-hidden ${
                p.position === 'Portero' ? 'border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20'
                : p.position === 'Especialista' ? 'border-purple-300 dark:border-purple-700 bg-purple-50/40 dark:bg-purple-950/20'
                : p.position === 'Polivalente' ? 'border-teal-300 dark:border-teal-700 bg-teal-50/40 dark:bg-teal-950/20'
                : 'border-gray-200 dark:border-zinc-700 bg-white/40 dark:bg-zinc-900/40'
              }`}>
                {/* CLICKABLE HEADER */}
                <div onClick={() => setExpandedPlayerId(isExpanded ? null : p.id)} className="flex items-center p-4 md:p-5 cursor-pointer active:bg-black/5 dark:active:bg-white/5">
                  {/* Dorsal */}
                  <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center font-black text-xl md:text-2xl text-white flex-shrink-0 ${
                    p.position === 'Portero' ? 'bg-amber-500' : p.position === 'Especialista' ? 'bg-purple-500' : p.position === 'Polivalente' ? 'bg-teal-500' : 'bg-blue-600'
                  }`}>
                    {p.number}
                  </div>
                  {/* Name + Position */}
                  <div className="ml-4 flex-1 min-w-0">
                    <h5 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase truncate leading-tight">{p.name}</h5>
                    <span className={`text-sm md:text-base font-bold uppercase block mt-0.5 ${
                      p.position === 'Portero' ? 'text-amber-600 dark:text-amber-400' : p.position === 'Especialista' ? 'text-purple-600 dark:text-purple-400' : p.position === 'Polivalente' ? 'text-teal-600 dark:text-teal-400' : 'text-blue-600 dark:text-blue-400'
                    }`}>{translatePosition(p.position, t)}</span>
                  </div>
                  {/* Quick stat */}
                  <div className="text-center flex-shrink-0 ml-3">
                    <span className="block text-3xl md:text-4xl font-mono font-black text-gray-900 dark:text-white leading-none">{p.position === 'Portero' ? pSaves : pTotalPoints}</span>
                    <span className="block text-[10px] md:text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase mt-0.5">{p.position === 'Portero' ? t.savesLabel : t.pointsLabel}</span>
                  </div>
                  {p.exclusions > 0 && (
                    <span className={`ml-2 px-2 py-1 rounded-lg text-xs font-black flex-shrink-0 ${p.exclusions >= 2 ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'}`}>
                      {p.exclusions >= 2 ? '🟥' : `${p.exclusions}E`}
                    </span>
                  )}
                  <ChevronDown className={`w-6 h-6 ml-2 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>

                {/* EXPANDED DETAIL */}
                {isExpanded && (
                  <div className="px-4 pb-5 md:px-5 md:pb-6 border-t border-gray-200 dark:border-zinc-700 pt-4">
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 md:gap-3">
                      {/* Overall effectiveness */}
                      {pTotalShots > 0 && (
                        <div className={`text-center rounded-xl p-3 border ${pEffectiveness >= 60 ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/50' : pEffectiveness >= 40 ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50' : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50'}`}>
                          <span className="block text-xs font-black uppercase text-gray-700 dark:text-zinc-400">% Total</span>
                          <span className={`block text-2xl md:text-3xl font-mono font-black mt-1 ${pEffectiveness >= 60 ? 'text-green-700 dark:text-green-300' : pEffectiveness >= 40 ? 'text-amber-700 dark:text-amber-300' : 'text-red-600 dark:text-red-300'}`}>{pEffectiveness.toFixed(0)}%</span>
                          <span className="block text-[10px] text-gray-500 dark:text-zinc-500 mt-0.5">{pTotalGoals}/{pTotalShots}</span>
                        </div>
                      )}
                      {/* +1 shots */}
                      {(() => {
                        const missed1p = p.missedShots - p.missedFlies - (p.missedSpins || 0) - (p.missedPenalties || 0);
                        const attempts1p = p.goals1p + Math.max(0, missed1p);
                        const eff1p = attempts1p > 0 ? (p.goals1p / attempts1p * 100) : 0;
                        return attempts1p > 0 ? (
                          <div className="text-center bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 border border-blue-200 dark:border-blue-800/50">
                            <span className="block text-xs font-black uppercase text-blue-700 dark:text-blue-400">+1</span>
                            <span className="block text-2xl md:text-3xl font-mono font-black text-blue-700 dark:text-blue-300 mt-1">{eff1p.toFixed(0)}%</span>
                            <span className="block text-[10px] text-gray-500 dark:text-zinc-500 mt-0.5">{p.goals1p}/{attempts1p}</span>
                          </div>
                        ) : null;
                      })()}
                      {/* Fly */}
                      {(() => { const flyGoals = p.goalsFlies || 0; const flyMissed = p.missedFlies || 0;
                        const flyAttempts = flyGoals + flyMissed;
                        const flyEff = flyAttempts > 0 ? (flyGoals / flyAttempts * 100) : 0;
                        return flyAttempts > 0 ? (
                          <div className="text-center bg-orange-50 dark:bg-orange-950/30 rounded-xl p-3 border border-orange-200 dark:border-orange-800/50">
                            <span className="block text-xs font-black uppercase text-orange-700 dark:text-orange-400">Fly</span>
                            <span className="block text-2xl md:text-3xl font-mono font-black text-orange-700 dark:text-orange-300 mt-1">{flyEff.toFixed(0)}%</span>
                            <span className="block text-[10px] text-gray-500 dark:text-zinc-500 mt-0.5">{flyGoals}/{flyAttempts}</span>
                          </div>
                        ) : null;
                      })()}
                      {/* Giro */}
                      {(() => { const giroGoals = p.goalsSpins || 0; const giroMissed = p.missedSpins || 0;
                        const giroAttempts = giroGoals + giroMissed;
                        const giroEff = giroAttempts > 0 ? (giroGoals / giroAttempts * 100) : 0;
                        return giroAttempts > 0 ? (
                          <div className="text-center bg-purple-50 dark:bg-purple-950/30 rounded-xl p-3 border border-purple-200 dark:border-purple-800/50">
                            <span className="block text-xs font-black uppercase text-purple-700 dark:text-purple-400">{language === 'en' ? 'Spin' : 'Giro'}</span>
                            <span className="block text-2xl md:text-3xl font-mono font-black text-purple-700 dark:text-purple-300 mt-1">{giroEff.toFixed(0)}%</span>
                            <span className="block text-[10px] text-gray-500 dark:text-zinc-500 mt-0.5">{giroGoals}/{giroAttempts}</span>
                          </div>
                        ) : null;
                      })()}
                      {/* Penalti */}
                      {(() => { const penGoals = p.goalsPenalties || 0; const penMissed = p.missedPenalties || 0;
                        const penAttempts = penGoals + penMissed;
                        const penEff = penAttempts > 0 ? (penGoals / penAttempts * 100) : 0;
                        return penAttempts > 0 ? (
                          <div className="text-center bg-red-50 dark:bg-red-950/30 rounded-xl p-3 border border-red-200 dark:border-red-800/50">
                            <span className="block text-xs font-black uppercase text-red-700 dark:text-red-400">{language === 'en' ? 'Penalty' : 'Penalti'}</span>
                            <span className="block text-2xl md:text-3xl font-mono font-black text-red-700 dark:text-red-300 mt-1">{penEff.toFixed(0)}%</span>
                            <span className="block text-[10px] text-gray-500 dark:text-zinc-500 mt-0.5">{penGoals}/{penAttempts}</span>
                          </div>
                        ) : null;
                      })()}
                      {/* GK: Saves */}
                      {p.position === 'Portero' && (
                        <div className="text-center bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 border border-blue-200 dark:border-blue-800/50">
                          <span className="block text-xs font-black uppercase text-blue-700 dark:text-blue-400">{t.saves}</span>
                          <span className="block text-2xl md:text-3xl font-mono font-black text-blue-700 dark:text-blue-300 mt-1">{pSaves}</span>
                        </div>
                      )}
                      {/* GK: Conceded */}
                      {p.position === 'Portero' && (
                        <div className="text-center bg-red-50 dark:bg-red-950/30 rounded-xl p-3 border border-red-200 dark:border-red-800/50">
                          <span className="block text-xs font-black uppercase text-red-700 dark:text-red-400">{t.conceded}</span>
                          <span className="block text-2xl md:text-3xl font-mono font-black text-red-600 dark:text-red-300 mt-1">{pGoalsConceded}</span>
                        </div>
                      )}
                      {/* GK: Save % */}
                      {p.position === 'Portero' && pGKTotal > 0 && (
                        <div className="text-center bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 border border-blue-200 dark:border-blue-800/50">
                          <span className="block text-xs font-black uppercase text-blue-700 dark:text-blue-400">{t.savePercent}</span>
                          <span className="block text-2xl md:text-3xl font-mono font-black text-blue-700 dark:text-blue-300 mt-1">{pSavePercentage.toFixed(0)}%</span>
                          <span className="block text-[10px] text-gray-500 dark:text-zinc-500 mt-0.5">{pSaves}/{pGKTotal}</span>
                        </div>
                      )}
                      {/* Turnovers */}
                      <div className="text-center bg-red-50 dark:bg-red-950/30 rounded-xl p-3 border border-red-200 dark:border-red-800/50">
                        <span className="block text-xs font-black uppercase text-red-700 dark:text-red-400">{t.losses}</span>
                        <span className="block text-2xl md:text-3xl font-mono font-black text-red-600 dark:text-red-300 mt-1">{pTurnovers}</span>
                      </div>
                      {/* Recoveries */}
                      {(p.recoveries || 0) > 0 && (
                        <div className="text-center bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-3 border border-indigo-200 dark:border-indigo-800/50">
                          <span className="block text-xs font-black uppercase text-indigo-700 dark:text-indigo-400">{t.recoveries}</span>
                          <span className="block text-2xl md:text-3xl font-mono font-black text-indigo-600 dark:text-indigo-300 mt-1">{p.recoveries}</span>
                        </div>
                      )}
                      {/* Assists */}
                      {(p.assists || 0) > 0 && (
                        <div className="text-center bg-cyan-50 dark:bg-cyan-950/30 rounded-xl p-3 border border-cyan-200 dark:border-cyan-800/50">
                          <span className="block text-xs font-black uppercase text-cyan-700 dark:text-cyan-400">Asist.</span>
                          <span className="block text-2xl md:text-3xl font-mono font-black text-cyan-600 dark:text-cyan-300 mt-1">{p.assists}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* EXPORT STATS */}
      <ExportStats matchState={matchState} sunMode={sunMode} />

    </div>
  );
}

