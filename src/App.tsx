/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MatchState, Player, SetState, GoogleUser } from './types';
import { INITIAL_MATCH_STATE, DEFAULT_PLAYERS, SHIRT_COLORS, INITIAL_SET_STATE } from './utils/initialState';
import GameBoard from './components/GameBoard';
import ShootoutBoard from './components/ShootoutBoard';
import AnalyticsHub from './components/AnalyticsHub';
import SetupTeam from './components/SetupTeam';
import GoogleLoginScreen from './components/GoogleLoginScreen';
import { Sun, Moon, Calendar, Trophy, Zap, DownloadCloud, RotateCcw, AlertCircle, HelpCircle, LogOut } from 'lucide-react';

export default function App() {
  // Load user session from localStorage
  const [user, setUser] = useState<GoogleUser | null>(() => {
    const saved = localStorage.getItem('beach_handball_user_2026');
    return saved ? JSON.parse(saved) : null;
  });

  // Save/Remove user session
  useEffect(() => {
    if (user) {
      localStorage.setItem('beach_handball_user_2026', JSON.stringify(user));
    } else {
      localStorage.removeItem('beach_handball_user_2026');
    }
  }, [user]);

  // Load state from localStorage on first boot
  const [matchState, setMatchState] = useState<MatchState>(() => {
    const saved = localStorage.getItem('beach_handball_match_state_2026');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          // Deduplicate player IDs
          if (Array.isArray(parsed.players)) {
            const playerIds = new Set<string>();
            parsed.players = parsed.players.map((p: any, idx: number) => {
              let pId = p.id;
              if (!pId || playerIds.has(pId)) {
                pId = `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`;
              }
              playerIds.add(pId);

              // Migrate old positions
              let position = p.position;
              if (position === 'Ala Izquierda') {
                position = 'Ala Izq.';
              } else if (position === 'Ala Derecha') {
                position = 'Ala Der.';
              }

              return { ...p, id: pId, position };
            });
          }
          // Deduplicate log/history events
          if (Array.isArray(parsed.historyEvents)) {
            const eventIds = new Set<string>();
            parsed.historyEvents = parsed.historyEvents.map((ev: any, idx: number) => {
              let evId = ev.id;
              if (!evId || eventIds.has(evId)) {
                evId = `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`;
              }
              eventIds.add(evId);
              return { ...ev, id: evId };
            });
          }
        }
        return parsed;
      } catch (e) {
        return INITIAL_MATCH_STATE;
      }
    }
    return INITIAL_MATCH_STATE;
  });

  const [activeTab, setActiveTab] = useState<'pista' | 'shootout' | 'analisis' | 'plantilla'>('pista');
  const [sunMode, setSunMode] = useState(true); // default to high-contrast Sun/Beach mode for outdoors!
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [hasAutoTransitionedToShootout, setHasAutoTransitionedToShootout] = useState(false);

  // Save state continuously to avoid lost data on court
  useEffect(() => {
    localStorage.setItem('beach_handball_match_state_2026', JSON.stringify(matchState));
  }, [matchState]);

  // Sync sunMode to HTML/body element class list for consistent background & text visibility
  useEffect(() => {
    if (sunMode) {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '#faf6eb'; // warm sand light background
    } else {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#0f172a'; // charcoal-950/slate-950 dark background
    }
  }, [sunMode]);

  const { currentPeriod, set1, set2, players, opponentName, shootoutRounds } = matchState;
  const ourTeamName = matchState.ourTeamName || 'Mi Equipo';

  // Custom shirt colors (hex strings, default to bright high contrast)
  const [ourShirtColor, setOurShirtColor] = useState('#ef4444'); // Default RED
  const [ourGkShirtColor, setOurGkShirtColor] = useState('#eab308'); // Default YELLOW
  const [opponentShirtColor, setOpponentShirtColor] = useState('#3b82f6'); // Default BLUE

  const updatePlayers = (updatedPlayers: Player[]) => {
    setMatchState((prev) => ({
      ...prev,
      players: updatedPlayers,
    }));
  };

  const updateTeamConfig = (config: {
    ourTeamName: string;
    opponentName: string;
    ourShirtColor: string;
    ourGkShirtColor: string;
    opponentShirtColor: string;
  }) => {
    setOurShirtColor(config.ourShirtColor);
    setOurGkShirtColor(config.ourGkShirtColor);
    setOpponentShirtColor(config.opponentShirtColor);
    setMatchState((prev) => ({
      ...prev,
      ourTeamName: config.ourTeamName,
      opponentName: config.opponentName,
    }));
  };

  const resetAllStats = () => {
    const listToReset = matchState.players && matchState.players.length > 0 ? matchState.players : DEFAULT_PLAYERS;
    const resetPlayers = listToReset.map(p => ({
      ...p,
      goals1p: 0,
      goals2p: 0,
      missedShots: 0,
      missedFlies: 0,
      turnoverBadPass: 0,
      turnoverSteps: 0,
      turnoverFumbling: 0,
      exclusions: 0,
      isDisqualified: false,
    }));

    setMatchState({
      currentPeriod: 'set1',
      set1: INITIAL_SET_STATE(1),
      set2: INITIAL_SET_STATE(2),
      shootoutRounds: Array.from({ length: 5 }, () => ({ usGoal: null, themGoal: null })),
      activePossession: 'us',
      passivePasses: null,
      players: resetPlayers,
      opponentName: matchState.opponentName || 'Oponente',
      ourTeamName: matchState.ourTeamName || 'Mi Equipo',
      rulesAlertActive: false,
      historyEvents: [],
    } as any);
    setActiveTab('pista');
    setShowResetConfirm(false);
  };

  const changePeriod = (period: 'set1' | 'set2' | 'shootout') => {
    setMatchState((prev) => ({
      ...prev,
      currentPeriod: period,
    }));
    if (period === 'shootout') {
      setActiveTab('shootout');
    } else {
      setActiveTab('pista');
    }
  };

  // Auto-transition to shootout when sets are tied 1-1 after both sets are finished
  useEffect(() => {
    const set1Finished = set1.isFinished;
    const set2Finished = set2.isFinished;
    const s1Winner = set1.isFinished ? set1.winner : null;
    const s2Winner = set2.isFinished ? set2.winner : null;

    const isTied = set1Finished && set2Finished && s1Winner && s2Winner && s1Winner !== s2Winner;

    if (isTied) {
      if (!hasAutoTransitionedToShootout) {
        changePeriod('shootout');
        setHasAutoTransitionedToShootout(true);
      }
    } else {
      if (hasAutoTransitionedToShootout) {
        setHasAutoTransitionedToShootout(false);
      }
    }
  }, [set1.isFinished, set2.isFinished, set1.winner, set2.winner, hasAutoTransitionedToShootout]);

  // Determine global match winner state
  const set1Winner = set1.isFinished ? set1.winner : null;
  const set2Winner = set2.isFinished ? set2.winner : null;

  // Render Google Login if not logged in
  if (!user) {
    return <GoogleLoginScreen onLoginSuccess={setUser} />;
  }

  return (
    <div className={`min-h-screen font-sans transition-all duration-300 ${sunMode
      ? 'bg-background text-slate-800'
      : 'bg-background text-slate-100 dark'
      }`}>

      {/* GLOBAL HEADER */}
      <header className={`border-b py-4 px-4 transition-all duration-300 shadow-card ${sunMode
        ? 'bg-white border-sand-155'
        : 'bg-charcoal-900 border-charcoal-800'
        }`} id="app_header">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">

          {/* Logo & Legal Disclaimer */}
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black shadow-card border transition-all duration-300 ${sunMode ? 'bg-charcoal-900 text-white border-sand-200' : 'bg-primary text-slate-950 border-secondary-border'
              }`}>
              BH
            </div>
            <div>
              <h1 className={`text-xl font-black tracking-tight uppercase flex items-center gap-2 ${sunMode ? 'text-slate-900' : 'text-white'
                }`}>
                BeachHandball Stats
              </h1>
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${sunMode ? 'text-slate-600' : 'text-slate-300'
                }`}>
                Registro táctico de alta velocidad
              </p>
            </div>
          </div>

          {/* QUICK SUMMARY MATCH RESULTS */}
          <div className={`flex gap-5 items-center py-2 px-5 rounded-xl border transition-all duration-300 shadow-sm ${sunMode
            ? 'border-sand-200 bg-[#FCFAF6] text-slate-900'
            : 'border-zinc-700 bg-charcoal-950 text-white'
            }`}>
            <div className="text-center">
              <span className={`block text-[9px] uppercase font-black tracking-wider ${sunMode ? 'text-slate-500' : 'text-zinc-400'
                }`}>SET 1</span>
              <span className={`text-sm font-mono font-black ${sunMode ? 'text-slate-950' : 'text-white'
                }`}>
                {set1.usScore} - {set1.themScore}
              </span>
              <span className={`block text-[8px] font-black uppercase ${sunMode ? 'text-slate-700' : 'text-zinc-300'
                }`}>
                {(set1.isFinished || set1.isGoldenGoal) ? 'Finalizado' : (currentPeriod === 'set1' ? 'En Curso' : (currentPeriod === 'set2' || currentPeriod === 'shootout') ? 'Finalizado' : 'Pendiente')}
              </span>
            </div>

            <div className={`h-8 border-r ${sunMode ? 'border-sand-200' : 'border-zinc-800'
              }`} />

            <div className="text-center">
              <span className={`block text-[9px] uppercase font-black tracking-wider ${sunMode ? 'text-slate-500' : 'text-zinc-400'
                }`}>SET 2</span>
              <span className={`text-sm font-mono font-black ${sunMode ? 'text-slate-950' : 'text-white'
                }`}>
                {set2.usScore} - {set2.themScore}
              </span>
              <span className={`block text-[8px] font-black uppercase ${sunMode ? 'text-slate-700' : 'text-zinc-300'
                }`}>
                {(set2.isFinished || set2.isGoldenGoal) ? 'Finalizado' : (currentPeriod === 'set2' ? 'En Curso' : (currentPeriod === 'shootout') ? 'Finalizado' : 'Pendiente')}
              </span>
            </div>

            {(set1Winner && set2Winner && set1Winner !== set2Winner) && (
              <>
                <div className={`h-8 border-r ${sunMode ? 'border-sand-200' : 'border-zinc-800'
                  }`} />
                <div className="text-center">
                  <span className="block text-[8px] uppercase text-danger font-black tracking-wider bg-red-100 dark:bg-red-950/40 px-1.5 py-0.5 rounded">SHOOTOUT</span>
                </div>
              </>
            )}
          </div>
          {/* CONTRAST & RESET CONTROLS */}
          <div className="flex items-center gap-2">

            {/* SUN MODE / OUTDOOR GLOW CONTROLLER */}
            <button
              onClick={() => setSunMode(!sunMode)}
              className={`p-2.5 rounded-lg border flex items-center justify-center gap-1.5 text-xs font-black uppercase transition-all duration-300 active:scale-[0.98] shadow-sm ${sunMode
                ? 'border-sand-200 bg-white text-slate-900 hover:bg-sand-50/50'
                : 'border-zinc-700 bg-charcoal-900 text-white hover:bg-charcoal-800'
                }`}
              title="Alternar Modo Sol/Playa"
              id="sun_mode_btn"
            >
              {sunMode ? (
                <>
                  <Moon className="w-4 h-4 text-primary" />
                  Sombra / Noche
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-warning animate-spin-slow" />
                  Sol / Pista
                </>
              )}
            </button>

            {/* RESET BUTTON */}
            <button
              onClick={() => setShowResetConfirm(true)}
              className={`p-2.5 rounded-lg border font-black flex items-center gap-1.5 text-xs transition-all duration-300 active:scale-[0.98] shadow-sm ${sunMode
                ? 'border-sand-200 bg-white text-slate-900 hover:bg-sand-50/50'
                : 'border-zinc-700 bg-charcoal-900 text-white hover:bg-charcoal-800'
                }`}
              title="Restablecer partido"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Partido
            </button>

            {/* USER PROFILE & LOGOUT */}
            <div className={`h-8 border-r ${sunMode ? 'border-sand-200' : 'border-zinc-800'}`} />

            <div className="flex items-center gap-2 pl-1">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-orange-400 shadow-xs"
                  title={user.email}
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full bg-orange-100 dark:bg-amber-950 flex items-center justify-center border border-orange-300 shadow-xs font-black text-xs text-orange-600 dark:text-orange-400"
                  title={user.email}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden md:block text-left">
                <span className={`block text-[10px] font-black leading-none ${sunMode ? 'text-slate-800' : 'text-slate-200'}`}>
                  {user.name}
                </span>
                <span className={`block text-[8px] font-black uppercase leading-none mt-0.5 ${sunMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {user.isGuest ? 'Invitado' : 'Google Auth'}
                </span>
              </div>
              <button
                onClick={() => setUser(null)}
                className={`p-2 rounded-lg border flex items-center justify-center transition-all duration-300 active:scale-[0.98] shadow-xs cursor-pointer ${sunMode
                  ? 'border-sand-200 bg-white text-slate-700 hover:bg-sand-50/50 hover:text-red-500'
                  : 'border-zinc-700 bg-charcoal-900 text-slate-300 hover:bg-charcoal-800 hover:text-red-400'
                  }`}
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* CORE NAVIGATION TABS */}
      <nav className={`py-1 px-4 border-b transition-colors duration-300 shadow-card ${sunMode ? 'bg-white border-sand-155' : 'bg-charcoal-900 border-charcoal-800'
        }`}>
        <div className="max-w-7xl mx-auto flex justify-around sm:justify-start gap-1 sm:gap-4 overflow-x-auto">
          <button
            onClick={() => {
              if (currentPeriod === 'shootout') {
                changePeriod('set2');
              } else {
                setActiveTab('pista');
              }
            }}
            className={`py-3 px-4 rounded-lg font-bold text-sm uppercase flex items-center gap-2 border-b-2 transition-all duration-300 active:scale-[0.98] ${activeTab === 'pista'
              ? 'border-primary text-primary font-extrabold'
              : sunMode
                ? 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-sand-50/50'
                : 'border-transparent text-slate-300 hover:text-white hover:bg-charcoal-800/50'
              }`}
          >
            📋 Partido
          </button>

          <button
            onClick={() => changePeriod('shootout')}
            className={`py-3 px-4 rounded-lg font-bold text-sm uppercase flex items-center gap-2 border-b-2 transition-all duration-300 active:scale-[0.98] ${activeTab === 'shootout'
              ? 'border-primary text-primary font-extrabold'
              : sunMode
                ? 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-sand-50/50'
                : 'border-transparent text-slate-300 hover:text-white hover:bg-charcoal-800/50'
              }`}
          >
            🎯 Shoot-out
          </button>

          <button
            onClick={() => setActiveTab('analisis')}
            className={`py-3 px-4 rounded-lg font-bold text-sm uppercase flex items-center gap-2 border-b-2 transition-all duration-300 active:scale-[0.98] ${activeTab === 'analisis'
              ? 'border-primary text-primary font-extrabold'
              : sunMode
                ? 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-sand-50/50'
                : 'border-transparent text-slate-300 hover:text-white hover:bg-charcoal-800/50'
              }`}
          >
            📊 Análisis Técnico
          </button>

          <button
            onClick={() => setActiveTab('plantilla')}
            className={`py-3 px-4 rounded-lg font-bold text-sm uppercase flex items-center gap-2 border-b-2 transition-all duration-300 active:scale-[0.98] ${activeTab === 'plantilla'
              ? 'border-primary text-primary font-extrabold'
              : sunMode
                ? 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-sand-50/50'
                : 'border-transparent text-slate-300 hover:text-white hover:bg-charcoal-800/50'
              }`}
          >
            ⚙️ Jugadores
          </button>
        </div>
      </nav>

      {/* CORE VIEWPORT */}
      <main className="max-w-7xl mx-auto py-5 mb-16 px-4">
        {activeTab === 'pista' && (
          <GameBoard
            matchState={matchState}
            ourShirtColor={ourShirtColor}
            ourGkShirtColor={ourGkShirtColor}
            opponentShirtColor={opponentShirtColor}
            onUpdateMatchState={setMatchState}
            sunMode={sunMode}
            changePeriod={changePeriod}
            onUpdateColorsAndNames={updateTeamConfig}
          />
        )}

        {activeTab === 'shootout' && (
          <ShootoutBoard
            matchState={matchState}
            ourShirtColor={ourShirtColor}
            opponentShirtColor={opponentShirtColor}
            onUpdateMatchState={setMatchState}
          />
        )}

        {activeTab === 'analisis' && (
          <AnalyticsHub matchState={matchState} />
        )}

        {activeTab === 'plantilla' && (
          <SetupTeam
            players={players}
            onUpdatePlayers={updatePlayers}
          />
        )}
      </main>

      {showResetConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className={`p-6 rounded-2xl max-w-md w-full shadow-2xl border-2 transform scale-100 transition-all ${sunMode
            ? 'bg-[#f4efe4] border-[#d8d2c4] text-zinc-900 shadow-xl'
            : 'bg-zinc-900 border-zinc-700 text-zinc-50 shadow-2xl'
            }`}>
            <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-amber-500">
              <RotateCcw className="w-8 h-8 animate-spin" />
              <h3 className="text-lg font-black uppercase tracking-wide">¿Restablecer Partido?</h3>
            </div>

            <p className="text-sm font-medium mb-6 opacity-95 leading-relaxed">
              ¿Estás seguro de que quieres limpiar todos los goles, exclusiones, pérdidas de balón y puntuaciones del partido actual?
              <br /><br />
              <span className="text-xs opacity-80 block border-t pt-2.5 mt-2">
                📌 <strong>Se conservará:</strong> El nombre de tu oponente y las configuraciones de tu plantilla (nombres, números, posiciones y roles de ataque/defensa predefinidos).
              </span>
            </p>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className={`py-2.5 px-4 rounded-xl font-bold text-xs uppercase cursor-pointer hover:opacity-85 transition active:scale-95 duration-100 ${sunMode ? 'bg-[#e5dfd3] text-zinc-800' : 'bg-zinc-800 text-zinc-100'
                  }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={resetAllStats}
                className="py-2.5 px-5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs uppercase cursor-pointer tracking-wider shadow-sm transition active:scale-95 duration-100"
              >
                Sí, restablecer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER ACCREDITATION AND LEGALITY */}
      <footer className={`fixed bottom-0 left-0 right-0 py-2.5 px-4 text-center select-none transition-colors ${sunMode ? 'bg-background text-charcoal-500' : 'bg-background text-charcoal-500'
        }`}>
        <p className="text-[10px] font-bold uppercase tracking-widest">
          © 2026 IAtpro74
        </p>
      </footer>
    </div>
  );
}

