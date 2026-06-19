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
    <div className="p-2 md:p-4 space-y-4 md:space-y-6">
      
      {/* SUMMARY BAR */}
      <div className="bg-background border-2 border-amber-500 rounded-2xl p-5 text-gray-900 dark:text-gray-100 flex flex-col sm:flex-row justify-between items-center shadow-md gap-4" id="analytics_summary_banner">
        <div className="flex items-center gap-3">
          <Award className="w-10 h-10 text-amber-500" />
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-gray-900 dark:text-gray-100">Estadísticas del Entrenador</h2>
            <p className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase">Métricas actualizadas en tiempo real de los sets de juego</p>
          </div>
        </div>
        <div className="flex gap-4 sm:gap-8 bg-gray-100 dark:bg-zinc-800/50 py-2.5 px-5 rounded-xl border border-gray-200 dark:border-zinc-700">
          <div className="text-center">
            <span className="block text-[10px] uppercase font-black text-gray-500 dark:text-zinc-400">Puntos Totales</span>
            <span className="text-3xl font-mono font-black text-gray-900 dark:text-gray-100">{totalPointsScored}</span>
          </div>
          <div className="text-center border-l border-gray-200 dark:border-zinc-700 pl-4 sm:pl-8">
            <span className="block text-[10px] uppercase font-black text-gray-500 dark:text-zinc-400">Efectividad</span>
            <span className="text-3xl font-mono font-black text-gray-900 dark:text-gray-100">{shootingSuccessAcc.toFixed(1)}%</span>
          </div>
          <div className="text-center border-l border-gray-200 dark:border-zinc-700 pl-4 sm:pl-8">
            <span className="block text-[10px] uppercase font-black text-gray-500 dark:text-zinc-400">Pérdidas</span>
            <span className="text-3xl font-mono font-black text-gray-900 dark:text-gray-100">{totalTurnovers}</span>
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

      {/* FULL DETAILED ROSTER STATS TABLE */}
      <div className="bg-background border border-gray-200 dark:border-zinc-800 rounded-2xl shadow p-5">
        <h4 className="text-base font-black text-gray-900 dark:text-zinc-100 uppercase mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-500" />
          Rendimiento Individual por Jugador
        </h4>

        <div className="overflow-x-auto -mx-2 px-2 md:mx-0 md:px-0">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 text-xs font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Dorsal</th>
                <th className="py-2.5 px-3">Nombre</th>
                <th className="py-2.5 px-3">Posición</th>
                <th className="py-2.5 px-3 text-center">Goles 1pt</th>
                <th className="py-2.5 px-3 text-center">Goles 2pt</th>
                <th className="py-2.5 px-3 text-center">Paradas</th>
                <th className="py-2.5 px-3 text-center">Goles Enc.</th>
                <th className="py-2.5 px-3 text-center">% Paradas</th>
                <th className="py-2.5 px-3 text-center">Fallo Común</th>
                <th className="py-2.5 px-3 text-center">Fallo Fly</th>
                <th className="py-2.5 px-3 text-center">Pérdidas</th>
                <th className="py-2.5 px-3 text-center">% Efect.</th>
                <th className="py-2.5 px-3 text-center">Exclusiones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800 text-sm">
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
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                    <td className="py-3 px-3 font-mono font-bold">#{p.number}</td>
                    <td className="py-3 px-3 font-semibold text-gray-900 dark:text-white">{p.name}</td>
                    <td className="py-3 px-3">
                      <span className={`text-xs py-0.5 px-2.5 rounded-full uppercase font-bold border ${
                        p.position === 'Portero'
                          ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300/30'
                          : p.position === 'Especialista'
                          ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-300/30'
                          : p.position === 'Polivalente'
                          ? 'bg-teal-100 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-300/30'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-zinc-200/50 dark:border-zinc-700/50'
                      }`}>
                        {p.position}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-green-600">{p.goals1p}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-green-600">{p.goals2p}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-blue-600">{pSaves}</td>
                    <td className="py-3 px-3 text-center font-mono">
                      {isGKType ? (
                        <span className="font-bold text-red-500">{pGoalsConceded}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {isGKType && pGKTotal > 0 ? (
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                          pSavePercentage >= 50 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : pSavePercentage >= 30 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {pSavePercentage.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-gray-500">{p.missedShots - p.missedFlies}</td>
                    <td className="py-3 px-3 text-center font-mono text-orange-600">{p.missedFlies}</td>
                    <td className="py-3 px-3 text-center font-mono text-red-500">{pTurnovers}</td>
                    <td className="py-3 px-3 text-center">
                      {pTotalShots > 0 ? (
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                          pEffectiveness >= 60 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : pEffectiveness >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {pEffectiveness.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                        p.exclusions === 1 ? 'bg-orange-500 text-white' : p.exclusions >= 2 ? 'bg-red-600 text-white animate-pulse' : 'text-gray-400'
                      }`}>
                        {p.exclusions === 0 ? 'Limpio' : `${p.exclusions} S`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
