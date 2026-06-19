import React from 'react';
import { Player, MatchState, EventLog } from '../types';
import { Target, Shield, AlertTriangle, Play, Flame, BarChart3, Users, Award } from 'lucide-react';

interface AnalyticsHubProps {
  matchState: MatchState;
}

export default function AnalyticsHub({ matchState }: AnalyticsHubProps) {
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
  const sortedPlayers = [...players].sort((a, b) => {
    const priority = (p: Player) => {
      if (p.position === 'Portero') return 0;
      if (p.position === 'Especialista') return 1;
      if (p.position === 'Polivalente') return 2;
      return 3;
    };
    return priority(a) - priority(b);
  });

  return (
    <div className="p-3 md:p-6 space-y-5 md:space-y-8">
      
      {/* SUMMARY BAR */}
      <div className="bg-background border-2 border-amber-500 rounded-2xl p-5 md:p-6 text-gray-900 dark:text-gray-100 flex flex-col sm:flex-row justify-between items-center shadow-md gap-4" id="analytics_summary_banner">
        <div className="flex items-center gap-3">
          <Award className="w-10 h-10 md:w-12 md:h-12 text-amber-500" />
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-gray-100">Estadísticas del Entrenador</h2>
            <p className="text-xs md:text-sm font-bold text-gray-500 dark:text-zinc-400 uppercase">Métricas actualizadas en tiempo real de los sets de juego</p>
          </div>
        </div>
        <div className="flex gap-5 sm:gap-8 bg-gray-100 dark:bg-zinc-800/50 py-3 px-6 rounded-xl border border-gray-200 dark:border-zinc-700">
          <div className="text-center">
            <span className="block text-[10px] md:text-xs uppercase font-black text-gray-500 dark:text-zinc-400">Puntos Totales</span>
            <span className="text-3xl md:text-4xl font-mono font-black text-gray-900 dark:text-gray-100">{totalPointsScored}</span>
          </div>
          <div className="text-center border-l border-gray-200 dark:border-zinc-700 pl-5 sm:pl-8">
            <span className="block text-[10px] md:text-xs uppercase font-black text-gray-500 dark:text-zinc-400">Efectividad</span>
            <span className="text-3xl md:text-4xl font-mono font-black text-gray-900 dark:text-gray-100">{shootingSuccessAcc.toFixed(1)}%</span>
          </div>
          <div className="text-center border-l border-gray-200 dark:border-zinc-700 pl-5 sm:pl-8">
            <span className="block text-[10px] md:text-xs uppercase font-black text-gray-500 dark:text-zinc-400">Pérdidas</span>
            <span className="text-3xl md:text-4xl font-mono font-black text-gray-900 dark:text-gray-100">{totalTurnovers}</span>
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

        {/* RISK STRATEGY ADVISOR */}
        <div className="bg-background border border-gray-200 dark:border-zinc-800 rounded-2xl shadow p-5">
          <h4 className="text-base font-black text-gray-900 dark:text-zinc-100 uppercase mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            Efectividad Táctica de Riesgo (Halftime Insight)
          </h4>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50 dark:bg-zinc-800 p-4 rounded-xl text-center">
                <span className="text-xs uppercase text-zinc-500 font-bold block mb-1">Acierto del Fly</span>
                <span className="text-3xl font-mono font-black text-orange-600 dark:text-orange-400">
                  {flySuccessRate.toFixed(1)}%
                </span>
                <span className="text-[10px] text-gray-500 block mt-1">Éxito en In-Flight</span>
              </div>

              <div className="bg-indigo-50 dark:bg-zinc-800 p-4 rounded-xl text-center">
                <span className="text-xs uppercase text-zinc-500 font-bold block mb-1">Ratio de Puntos</span>
                <span className="text-3xl font-mono font-black text-indigo-500">
                  {totalPointsScored > 0 ? ((totalGoals2p * 2 / totalPointsScored) * 100).toFixed(0) : 0}%
                </span>
                <span className="text-[10px] text-gray-500 block mt-1">Puntos vía Dobles</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* FULL DETAILED ROSTER STATS - CARD LAYOUT FOR OUTDOOR READABILITY */}
      <div className="bg-background border-2 border-gray-200 dark:border-zinc-800 rounded-2xl shadow p-4 md:p-6">
        <h4 className="text-lg md:text-xl font-black text-gray-900 dark:text-zinc-100 uppercase mb-5 md:mb-6 flex items-center gap-2">
          <Users className="w-6 h-6 md:w-7 md:h-7 text-amber-500" />
          Rendimiento Individual por Jugador
        </h4>

        <div className="space-y-4 md:space-y-5">
          {sortedPlayers.map((p) => {
                const pTurnovers = p.turnoverBadPass + p.turnoverSteps + p.turnoverFumbling;
                const pSaves = Math.max(p.saves || 0, historyEvents.filter((ev) => 
                  ev.type === 'save' && 
                  ev.description.includes('PARADA') && 
                  ev.description.includes(p.name)
                ).length);
                const pTotalGoals = p.goals1p + p.goals2p;
                const pTotalShots = pTotalGoals + p.missedShots;
                const pEffectiveness = pTotalShots > 0 ? (pTotalGoals / pTotalShots) * 100 : 0;
                const isGKType = p.position === 'Portero' || p.position === 'Especialista' || p.position === 'Polivalente';
                const pGoalsConceded = p.goalsConceded || 0;
                const pGKTotal = pSaves + pGoalsConceded;
                const pSavePercentage = pGKTotal > 0 ? (pSaves / pGKTotal) * 100 : 0;
                
                return (
                  <div key={p.id} className={`border-2 rounded-2xl p-4 md:p-5 ${
                    p.position === 'Portero'
                      ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20'
                      : p.position === 'Especialista'
                      ? 'border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20'
                      : p.position === 'Polivalente'
                      ? 'border-teal-300 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-950/20'
                      : 'border-gray-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50'
                  }`}>
                    {/* Player Header */}
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200 dark:border-zinc-700">
                      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center font-black text-lg md:text-xl text-white shadow-sm ${
                        p.position === 'Portero' ? 'bg-amber-500' 
                        : p.position === 'Especialista' ? 'bg-purple-500' 
                        : p.position === 'Polivalente' ? 'bg-teal-500' 
                        : 'bg-blue-600'
                      }`}>
                        {p.number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase truncate">
                          {p.name}
                        </h5>
                        <span className={`text-sm md:text-base font-bold uppercase ${
                          p.position === 'Portero' ? 'text-amber-600 dark:text-amber-400' 
                          : p.position === 'Especialista' ? 'text-purple-600 dark:text-purple-400'
                          : p.position === 'Polivalente' ? 'text-teal-600 dark:text-teal-400'
                          : 'text-blue-600 dark:text-blue-400'
                        }`}>
                          {p.position}
                        </span>
                      </div>
                      {/* Effectiveness Badge */}
                      {pTotalShots > 0 && (
                        <div className={`px-3 py-1.5 rounded-xl text-base md:text-lg font-black ${
                          pEffectiveness >= 60 ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' 
                          : pEffectiveness >= 40 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                        }`}>
                          {pEffectiveness.toFixed(0)}%
                        </div>
                      )}
                      {/* Exclusion Badge */}
                      {p.exclusions > 0 && (
                        <span className={`px-2.5 py-1 rounded-lg text-sm font-black ${
                          p.exclusions >= 2 ? 'bg-red-600 text-white animate-pulse' : 'bg-orange-500 text-white'
                        }`}>
                          {p.exclusions >= 2 ? '🟥 ROJA' : `${p.exclusions} Excl.`}
                        </span>
                      )}
                    </div>

                    {/* Stats Grid - Large numbers for outdoor */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
                      {/* Goals 1pt */}
                      <div className="text-center bg-green-50 dark:bg-green-950/30 rounded-xl p-2.5 md:p-3 border border-green-200 dark:border-green-800/50">
                        <span className="block text-[10px] md:text-xs font-black uppercase text-green-700 dark:text-green-400 mb-1">Goles 1pt</span>
                        <span className="block text-2xl md:text-3xl font-mono font-black text-green-700 dark:text-green-300">{p.goals1p}</span>
                      </div>
                      {/* Goals 2pt */}
                      <div className="text-center bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-2.5 md:p-3 border border-emerald-200 dark:border-emerald-800/50">
                        <span className="block text-[10px] md:text-xs font-black uppercase text-emerald-700 dark:text-emerald-400 mb-1">Goles 2pt</span>
                        <span className="block text-2xl md:text-3xl font-mono font-black text-emerald-700 dark:text-emerald-300">{p.goals2p}</span>
                      </div>
                      {/* Saves (GK types) */}
                      {isGKType && (
                        <div className="text-center bg-blue-50 dark:bg-blue-950/30 rounded-xl p-2.5 md:p-3 border border-blue-200 dark:border-blue-800/50">
                          <span className="block text-[10px] md:text-xs font-black uppercase text-blue-700 dark:text-blue-400 mb-1">Paradas</span>
                          <span className="block text-2xl md:text-3xl font-mono font-black text-blue-700 dark:text-blue-300">{pSaves}</span>
                        </div>
                      )}
                      {/* Goals Conceded (GK types) */}
                      {isGKType && (
                        <div className="text-center bg-red-50 dark:bg-red-950/30 rounded-xl p-2.5 md:p-3 border border-red-200 dark:border-red-800/50">
                          <span className="block text-[10px] md:text-xs font-black uppercase text-red-700 dark:text-red-400 mb-1">Encajados</span>
                          <span className="block text-2xl md:text-3xl font-mono font-black text-red-600 dark:text-red-300">{pGoalsConceded}</span>
                        </div>
                      )}
                      {/* Save % (GK types) */}
                      {isGKType && pGKTotal > 0 && (
                        <div className={`text-center rounded-xl p-2.5 md:p-3 border ${
                          pSavePercentage >= 50 ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/50' 
                          : pSavePercentage >= 30 ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50' 
                          : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50'
                        }`}>
                          <span className="block text-[10px] md:text-xs font-black uppercase text-gray-700 dark:text-zinc-400 mb-1">% Paradas</span>
                          <span className={`block text-2xl md:text-3xl font-mono font-black ${
                            pSavePercentage >= 50 ? 'text-green-700 dark:text-green-300' 
                            : pSavePercentage >= 30 ? 'text-amber-700 dark:text-amber-300' 
                            : 'text-red-600 dark:text-red-300'
                          }`}>{pSavePercentage.toFixed(0)}%</span>
                        </div>
                      )}
                      {/* Missed Shots */}
                      <div className="text-center bg-orange-50 dark:bg-orange-950/30 rounded-xl p-2.5 md:p-3 border border-orange-200 dark:border-orange-800/50">
                        <span className="block text-[10px] md:text-xs font-black uppercase text-orange-700 dark:text-orange-400 mb-1">Fallos</span>
                        <span className="block text-2xl md:text-3xl font-mono font-black text-orange-600 dark:text-orange-300">{p.missedShots}</span>
                      </div>
                      {/* Missed Flies */}
                      {!isGKType && (
                        <div className="text-center bg-amber-50 dark:bg-amber-950/30 rounded-xl p-2.5 md:p-3 border border-amber-200 dark:border-amber-800/50">
                          <span className="block text-[10px] md:text-xs font-black uppercase text-amber-700 dark:text-amber-400 mb-1">Err. Fly</span>
                          <span className="block text-2xl md:text-3xl font-mono font-black text-amber-600 dark:text-amber-300">{p.missedFlies}</span>
                        </div>
                      )}
                      {/* Turnovers */}
                      <div className="text-center bg-red-50 dark:bg-red-950/30 rounded-xl p-2.5 md:p-3 border border-red-200 dark:border-red-800/50">
                        <span className="block text-[10px] md:text-xs font-black uppercase text-red-700 dark:text-red-400 mb-1">Pérdidas</span>
                        <span className="block text-2xl md:text-3xl font-mono font-black text-red-600 dark:text-red-300">{pTurnovers}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>

    </div>
  );
}
