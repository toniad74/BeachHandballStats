import React, { useState } from 'react';
import { Player, MatchState, ShootoutRound } from '../types';
import { Target, AlertCircle, RefreshCw, Trophy } from 'lucide-react';

interface ShootoutBoardProps {
  matchState: MatchState;
  ourShirtColor: string;
  opponentShirtColor: string;
  onUpdateMatchState: (state: MatchState) => void;
}

export default function ShootoutBoard({
  matchState,
  ourShirtColor,
  opponentShirtColor,
  onUpdateMatchState,
}: ShootoutBoardProps) {
  const { players, opponentName, shootoutRounds } = matchState;
  const ourTeamName = matchState.ourTeamName || 'Mi Equipo';

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
  
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(sortedPlayers[0]?.id || '');
  const [extraRoundCount, setExtraRoundCount] = useState(0);
  const [resetConfirmActive, setResetConfirmActive] = useState(false);

  // Totals
  const usGoals = shootoutRounds.filter(r => r.usGoal === true).length;
  const themGoals = shootoutRounds.filter(r => r.themGoal === true).length;

  const usPointsTotal = shootoutRounds.reduce((acc, r) => acc + (r.usGoal ? (r.usPoints ?? 2) : 0), 0);
  const themPointsTotal = shootoutRounds.reduce((acc, r) => acc + (r.themGoal ? (r.themPoints ?? 2) : 0), 0);

  const currentRoundIndex = shootoutRounds.findIndex(r => r.usGoal === null || r.themGoal === null);
  const activeRoundIndex = currentRoundIndex === -1 ? shootoutRounds.length - 1 : currentRoundIndex;

  const handleShootResult = (roundIndex: number, team: 'us' | 'them', success: boolean, points: number = 2) => {
    const updatedRounds = [...shootoutRounds];
    
    if (team === 'us') {
      updatedRounds[roundIndex] = {
        ...updatedRounds[roundIndex],
        usGoal: success,
        usPlayerId: selectedPlayerId,
        usPoints: success ? points : 0,
      };

      // Add analytics to the selected player
      if (success) {
        const updatedPlayers = players.map(p => {
          if (p.id === selectedPlayerId) {
            if (points === 2) {
              return { ...p, goals2p: (p.goals2p || 0) + 1 };
            } else {
              return { ...p, goals1p: (p.goals1p || 0) + 1 };
            }
          }
          return p;
        });
        onUpdateMatchState({
          ...matchState,
          players: updatedPlayers,
          shootoutRounds: updatedRounds,
        });
      } else {
        const updatedPlayers = players.map(p => {
          if (p.id === selectedPlayerId) {
            return { ...p, missedShots: (p.missedShots || 0) + 1 };
          }
          return p;
        });
        onUpdateMatchState({
          ...matchState,
          players: updatedPlayers,
          shootoutRounds: updatedRounds,
        });
      }
    } else {
      updatedRounds[roundIndex] = {
        ...updatedRounds[roundIndex],
        themGoal: success,
        themPoints: success ? points : 0,
      };
      onUpdateMatchState({
        ...matchState,
        shootoutRounds: updatedRounds,
      });
    }
  };

  const addExtraRound = () => {
    // Append sudden death round
    const updatedRounds = [...shootoutRounds, { usGoal: null, themGoal: null }];
    setExtraRoundCount(prev => prev + 1);
    onUpdateMatchState({
      ...matchState,
      shootoutRounds: updatedRounds,
    });
  };

  const resetShootout = () => {
    if (!resetConfirmActive) {
      setResetConfirmActive(true);
      // Auto cancel confirmation after 4 seconds
      setTimeout(() => setResetConfirmActive(false), 4000);
    } else {
      setResetConfirmActive(false);
      setExtraRoundCount(0);
      onUpdateMatchState({
        ...matchState,
        shootoutRounds: Array.from({ length: 5 }, () => ({ usGoal: null, themGoal: null })),
      });
    }
  };

  return (
    <div className="p-4 space-y-6">
      
      {/* SCORE HEADER */}
      <div className="bg-background border-2 border-amber-500 rounded-3xl p-6 text-gray-900 dark:text-gray-100 text-center shadow-md">
        <span className="bg-amber-500 text-zinc-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-widest">
          Desempate Shootout (Uno contra el Portero)
        </span>
        
        <div className="flex justify-center items-center gap-12 mt-4">
          <div className="text-right">
            <span className="block text-xs uppercase text-gray-500 dark:text-zinc-400 font-bold">{ourTeamName}</span>
            <span className="text-5xl sm:text-7xl font-mono font-black text-gray-900 dark:text-gray-100">{usPointsTotal}</span>
          </div>

          <div className="w-12 h-12 rounded-full border border-gray-300 dark:border-zinc-700 font-bold flex items-center justify-center text-gray-500 dark:text-zinc-400 text-lg">
            SL
          </div>

          <div className="text-left">
            <span className="block text-xs uppercase text-gray-500 dark:text-zinc-400 font-bold">{opponentName}</span>
            <span className="text-5xl sm:text-7xl font-mono font-black text-amber-500">{themPointsTotal}</span>
          </div>
        </div>

        {/* DECISION HELPER */}
        {shootoutRounds.every(r => r.usGoal !== null && r.themGoal !== null) && (
          <div className="mt-4 p-3 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl inline-flex items-center gap-2 text-gray-850 dark:text-zinc-200">
            <Trophy className="w-5 h-5 text-amber-500 animate-bounce" />
            <span className="text-sm font-bold">
              {usGoals === themGoals 
                ? '¡Empate tras la ronda reglamentaria! Añade "Ronda Extra" para Muerte Súbita'
                : `Ganador provisional: ${usGoals > themGoals ? ourTeamName : opponentName}`
              }
            </span>
          </div>
        )}
      </div>

      {/* TACTICAL ASSIGNMENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COMPONENT: ROUND LOGGING */}
        <div className="lg:col-span-8 bg-background border border-gray-200 dark:border-zinc-800 rounded-2xl shadow p-5">
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-zinc-800 pb-2.5">
            <h3 className="text-lg font-black uppercase text-gray-900 dark:text-zinc-100 flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-500" />
              Lanzamientos Alternados ({shootoutRounds.length} rondas)
            </h3>

            <div className="flex gap-2">
              <button
                onClick={addExtraRound}
                className="bg-orange-500 hover:bg-orange-600 shrink-0 text-white font-extrabold text-xs py-1.5 px-3 rounded-lg shadow-sm"
              >
                + Muerte Súbita
              </button>
              <button
                onClick={resetShootout}
                className={`text-xs font-black py-1.5 px-3 rounded-lg border uppercase transition-all duration-150 active:scale-95 select-none ${
                  resetConfirmActive
                    ? 'bg-red-600 text-white border-red-700 animate-pulse font-black'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 border-gray-300 dark:border-zinc-750'
                }`}
                title={resetConfirmActive ? "Pulsa de nuevo para confirmar el reset de shootouts" : "Limpiar shootouts"}
              >
                {resetConfirmActive ? '⚠️ ¿Confirmar?' : 'Limpiar Tanda'}
              </button>
            </div>
          </div>

          {/* TABLE OF ROUNDS */}
          <div className="space-y-3">
            {shootoutRounds.map((round, idx) => {
              const usIsDone = round.usGoal !== null;
              const themIsDone = round.themGoal !== null;
              const isCurrent = idx === activeRoundIndex;

              return (
                <div
                  key={`so-round-${idx}`}
                  className={`border-2 rounded-2xl p-4 transition ${
                    isCurrent 
                      ? 'border-amber-500 bg-amber-50/10 dark:bg-zinc-800/20 shadow' 
                      : 'border-gray-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10'
                  }`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-extrabold text-sm uppercase text-gray-600 dark:text-zinc-400">
                      Ronda {idx + 1} {idx >= 5 && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded ml-1">Muerte Súbita</span>}
                    </span>
                    {isCurrent && (
                      <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">
                        Lanzamiento Activo
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* OUR TEAM ATTEMPT */}
                    <div className="bg-slate-100 dark:bg-zinc-800 p-3 rounded-xl border border-slate-200 dark:border-zinc-700">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black text-slate-900 dark:text-zinc-50 flex items-center gap-1.5 uppercase">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ourShirtColor }} />
                          {ourTeamName}
                        </span>
                        
                        {/* Selected Player Badge */}
                        {usIsDone ? (
                          <span className="text-[10px] bg-amber-100 dark:bg-amber-950/50 p-1 rounded font-extrabold text-amber-900 dark:text-amber-200">
                            Lanzó: {players.find(p => p.id === round.usPlayerId)?.name || 'Jugador'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-extrabold uppercase">Por lanzar</span>
                        )}
                      </div>

                      {usIsDone ? (
                        <div className={`p-2.5 text-center font-black rounded-lg uppercase text-xs ${
                          round.usGoal ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {round.usGoal 
                            ? `+${round.usPoints ?? 2}` 
                            : 'FALLO / PARADA'}
                        </div>
                      ) : (
                        <div className="flex gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleShootResult(idx, 'us', true, 2)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 px-2 rounded-lg text-[10px] uppercase tracking-wider flex-1 transition active:scale-95 shadow-sm"
                            title="Gol de valor doble: Giro 360, Fly, Gol de Portero o Especialista"
                          >
                            +2
                          </button>
                          <button
                            onClick={() => handleShootResult(idx, 'us', true, 1)}
                            className="bg-teal-600 hover:bg-teal-700 text-white font-black py-2 px-2 rounded-lg text-[10px] uppercase tracking-wider flex-1 transition active:scale-95 shadow-sm"
                            title="Gol simple o de valor sencillo"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => handleShootResult(idx, 'us', false)}
                            className="bg-red-600 hover:bg-red-700 text-white font-black py-2 px-2.5 rounded-lg text-[10px] uppercase tracking-wider transition active:scale-95 shadow-sm"
                          >
                            ✗ Fallo
                          </button>
                        </div>
                      )}
                    </div>

                    {/* OPPONENT TEAM ATTEMPT */}
                    <div className="bg-slate-100 dark:bg-zinc-800 p-3 rounded-xl border border-slate-200 dark:border-zinc-700">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black text-slate-900 dark:text-zinc-50 flex items-center gap-1.5 uppercase">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: opponentShirtColor }} />
                          {opponentName}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-extrabold uppercase">Contra portería</span>
                      </div>

                      {themIsDone ? (
                        <div className={`p-2.5 text-center font-black rounded-lg uppercase text-xs ${
                          round.themGoal ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {round.themGoal 
                            ? `+${round.themPoints ?? 2}` 
                            : 'PARADA / FUERA'}
                        </div>
                      ) : (
                        <div className="flex gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleShootResult(idx, 'them', true, 2)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 px-2 rounded-lg text-[10px] uppercase tracking-wider flex-1 transition active:scale-95 shadow-sm"
                            title="Gol rival de valor doble"
                          >
                            +2
                          </button>
                          <button
                            onClick={() => handleShootResult(idx, 'them', true, 1)}
                            className="bg-teal-600 hover:bg-teal-700 text-white font-black py-2 px-2 rounded-lg text-[10px] uppercase tracking-wider flex-1 transition active:scale-95 shadow-sm"
                            title="Gol rival de valor sencillo"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => handleShootResult(idx, 'them', false)}
                            className="bg-red-600 hover:bg-red-700 text-white font-black py-2 px-2.5 rounded-lg text-[10px] uppercase tracking-wider transition active:scale-95 shadow-sm"
                          >
                            ✗ Fallo Rival
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COMPONENT: SHOOTER ASSIGNMENT */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-background border border-gray-200 dark:border-zinc-800 rounded-2xl shadow p-5">
            <h3 className="text-base font-black uppercase text-gray-950 dark:text-zinc-100 flex items-center gap-2 mb-3">
              Selección de Tirador
            </h3>
            
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4 select-none leading-relaxed">
              Elige qué jugador va a lanzar a continuación para guardar su tiro doble en las estadísticas:
            </p>

            <div className="grid grid-cols-2 gap-2">
              {sortedPlayers.map((p) => {
                const hasShot = shootoutRounds.some(r => r.usPlayerId === p.id);
                return (
                  <button
                    key={`so-p-${p.id}`}
                    onClick={() => setSelectedPlayerId(p.id)}
                    disabled={p.isDisqualified}
                    className={`border-2 p-2.5 rounded-xl text-xs font-black text-left transition flex justify-between items-center ${
                      p.isDisqualified
                        ? 'border-gray-205 bg-gray-100 opacity-40 cursor-not-allowed text-zinc-400'
                        : selectedPlayerId === p.id
                        ? 'border-amber-500 bg-amber-50/30 dark:bg-zinc-800 text-amber-950 dark:text-amber-400 font-extrabold shadow-sm'
                        : hasShot
                        ? 'border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30 text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800'
                        : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-950 dark:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <span className="truncate pr-1">
                      #{p.number} {p.name.split(' ')[1] || p.name}
                      {hasShot && <span className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 ml-1">(Lanzó)</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
