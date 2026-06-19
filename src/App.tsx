/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MatchState, Player, SetState, GoogleUser } from './types';
import { INITIAL_MATCH_STATE, DEFAULT_PLAYERS, SHIRT_COLORS, INITIAL_SET_STATE } from './utils/initialState';
import { Language, getTranslations, LANGUAGE_OPTIONS } from './utils/i18n';
import { useI18n } from './i18n';
import GameBoard from './components/GameBoard';
import ShootoutBoard from './components/ShootoutBoard';
import AnalyticsHub from './components/AnalyticsHub';
import SetupTeam from './components/SetupTeam';
import MatchHistory from './components/MatchHistory';
import Tutorial from './components/Tutorial';
import GoogleLoginScreen from './components/GoogleLoginScreen';
import { Sun, Moon, Calendar, Trophy, Zap, DownloadCloud, RotateCcw, AlertCircle, HelpCircle, LogOut, Save, FolderOpen, ChevronDown, Globe } from 'lucide-react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Listen to Firebase Auth state changes for session persistence
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
          picture: firebaseUser.photoURL || undefined,
        });
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

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

  const [activeTab, setActiveTab] = useState<'pista' | 'shootout' | 'analisis' | 'plantilla' | 'historial'>('pista');
  const [sunMode, setSunMode] = useState(true); // default to high-contrast Sun/Beach mode for outdoors!
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [hasAutoTransitionedToShootout, setHasAutoTransitionedToShootout] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMatchHistory, setShowMatchHistory] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Language (from context)
  const { language, setLanguage, t } = useI18n();

  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallButton(false);
    }
    setDeferredPrompt(null);
  };

  // Save state continuously to avoid lost data on court
  useEffect(() => {
    localStorage.setItem('beach_handball_match_state_2026', JSON.stringify(matchState));
  }, [matchState]);

  // Sync sunMode to HTML/body element class list for consistent background & text visibility
  useEffect(() => {
    if (sunMode) {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '#ffffff';
    } else {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#020617';
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
      assists: 0,
      missedShots: 0,
      missedFlies: 0,
      missedSpins: 0,
      missedPenalties: 0,
      turnoverBadPass: 0,
      turnoverSteps: 0,
      turnoverFumbling: 0,
      recoveries: 0,
      saves: 0,
      goalsConceded: 0,
      exclusions: 0,
      isDisqualified: false,
      isSuspended: false,
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

  // Show loading while Firebase checks auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900/10">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-bold text-slate-500">Cargando...</p>
        </div>
      </div>
    );
  }

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
      <header className={`border-b py-3 px-3 md:py-4 md:px-6 transition-all duration-300 shadow-card ${sunMode
        ? 'bg-white border-sand-155'
        : 'bg-charcoal-900 border-charcoal-800'
        }`} id="app_header">
        <div className="max-w-7xl mx-auto space-y-2">
          {/* TOP ROW: Logo + Controls (always same line) */}
          <div className="flex items-center gap-2 md:gap-4">

            {/* Logo */}
            <div className="flex items-center gap-2 md:gap-3 shrink-0 min-w-0">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-black text-base md:text-lg shadow-card border transition-all duration-300 flex-shrink-0 ${sunMode ? 'bg-charcoal-900 text-white border-sand-200' : 'bg-primary text-slate-950 border-secondary-border'
                }`}>
                BH
              </div>
              <div className="min-w-0">
                <h1 className={`text-base md:text-xl font-black tracking-tight uppercase truncate ${sunMode ? 'text-slate-900' : 'text-white'
                  }`}>
                  BeachHandball Stats
                </h1>
              </div>
            </div>

            {/* CONTROLS - always right side */}
            <div className="flex items-center gap-1.5 md:gap-3 shrink-0 ml-auto">

              {/* LANGUAGE SELECTOR */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className={`p-2 md:p-2.5 rounded-lg border font-black text-xs appearance-none cursor-pointer transition-all ${sunMode
                  ? 'border-sand-200 bg-white text-slate-900'
                  : 'border-zinc-700 bg-charcoal-900 text-white'
                }`}
                title="Idioma / Language"
              >
                {LANGUAGE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {/* SUN MODE */}
              <button
                onClick={() => setSunMode(!sunMode)}
                className={`p-2 md:p-2.5 rounded-lg border flex items-center justify-center gap-1.5 text-xs font-black uppercase transition-all duration-300 active:scale-[0.98] shadow-sm ${sunMode
                  ? 'border-sand-200 bg-white text-slate-900 hover:bg-sand-50/50'
                  : 'border-zinc-700 bg-charcoal-900 text-white hover:bg-charcoal-800'
                  }`}
                title="Alternar Modo Sol/Playa"
                id="sun_mode_btn"
              >
                {sunMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-warning" />}
              </button>

              {/* RESET */}
              <button
                onClick={() => setShowResetConfirm(true)}
                className={`p-2 md:p-2.5 rounded-lg border font-black flex items-center transition-all duration-300 active:scale-[0.98] shadow-sm ${sunMode
                  ? 'border-sand-200 bg-white text-slate-900 hover:bg-sand-50/50'
                  : 'border-zinc-700 bg-charcoal-900 text-white hover:bg-charcoal-800'
                  }`}
                title="Restablecer partido"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* HELP / TUTORIAL */}
              <button
                onClick={() => setShowTutorial(true)}
                className={`p-2 md:p-2.5 rounded-lg border font-black flex items-center transition-all duration-300 active:scale-[0.98] shadow-sm ${sunMode
                  ? 'border-sand-200 bg-white text-slate-900 hover:bg-sand-50/50'
                  : 'border-zinc-700 bg-charcoal-900 text-white hover:bg-charcoal-800'
                }`}
                title="Tutorial"
              >
                <HelpCircle className="w-5 h-5" />
              </button>

              {/* INSTALL APP */}
              {showInstallButton && (
                <button
                  onClick={handleInstallClick}
                  className={`p-2 md:p-2.5 rounded-lg border font-black flex items-center transition-all duration-300 active:scale-[0.98] shadow-sm animate-pulse ${sunMode
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-emerald-700 bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/50'
                    }`}
                  title="Instalar app"
                >
                  <DownloadCloud className="w-5 h-5" />
                </button>
              )}

              {/* SEPARATOR */}
              <div className={`h-8 border-r ${sunMode ? 'border-sand-200' : 'border-zinc-800'}`} />

              {/* USER PROFILE & LOGOUT */}
              <div className="flex items-center gap-1.5 md:gap-2">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-orange-400 shadow-xs"
                    title={user.email}
                  />
                ) : (
                  <div
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-orange-100 dark:bg-amber-950 flex items-center justify-center border border-orange-300 shadow-xs font-black text-sm text-orange-600 dark:text-orange-400"
                    title={user.email}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => { signOut(auth); setUser(null); }}
                  className={`p-2 md:p-2.5 rounded-lg border flex items-center justify-center transition-all duration-300 active:scale-[0.98] shadow-xs cursor-pointer ${sunMode
                    ? 'border-sand-200 bg-white text-slate-700 hover:bg-sand-50/50 hover:text-red-500'
                    : 'border-zinc-700 bg-charcoal-900 text-slate-300 hover:bg-charcoal-800 hover:text-red-400'
                    }`}
                  title="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* BOTTOM ROW: Match Results Summary */}
          <div className={`flex gap-4 items-center py-1.5 px-4 rounded-xl border transition-all duration-300 shadow-sm justify-center ${sunMode
            ? 'border-sand-200 bg-[#FCFAF6] text-slate-900'
            : 'border-zinc-700 bg-charcoal-950 text-white'
            }`}>
            <div className="text-center">
              <span className={`block text-[10px] md:text-xs uppercase font-black tracking-wider ${sunMode ? 'text-slate-500' : 'text-zinc-400'
                }`}>SET 1</span>
              <span className={`text-base md:text-lg font-mono font-black ${sunMode ? 'text-slate-950' : 'text-white'
                }`}>
                {set1.usScore} - {set1.themScore}
              </span>
              <span className={`block text-[9px] md:text-[10px] font-black uppercase ${sunMode ? 'text-slate-700' : 'text-zinc-300'
                }`}>
                {(set1.isFinished || set1.isGoldenGoal) ? t.finished : (currentPeriod === 'set1' ? t.inProgress : (currentPeriod === 'set2' || currentPeriod === 'shootout') ? t.finished : t.pending)}
              </span>
            </div>

            <div className={`h-10 border-r ${sunMode ? 'border-sand-200' : 'border-zinc-800'}`} />

            <div className="text-center">
              <span className={`block text-[10px] md:text-xs uppercase font-black tracking-wider ${sunMode ? 'text-slate-500' : 'text-zinc-400'
                }`}>SET 2</span>
              <span className={`text-base md:text-lg font-mono font-black ${sunMode ? 'text-slate-950' : 'text-white'
                }`}>
                {set2.usScore} - {set2.themScore}
              </span>
              <span className={`block text-[9px] md:text-[10px] font-black uppercase ${sunMode ? 'text-slate-700' : 'text-zinc-300'
                }`}>
                {(set2.isFinished || set2.isGoldenGoal) ? t.finished : (currentPeriod === 'set2' ? t.inProgress : (currentPeriod === 'shootout') ? t.finished : t.pending)}
              </span>
            </div>

            {(set1Winner && set2Winner && set1Winner !== set2Winner) && (
              <>
                <div className={`h-10 border-r ${sunMode ? 'border-sand-200' : 'border-zinc-800'}`} />
                <div className="text-center">
                  <span className="block text-[9px] md:text-xs uppercase text-danger font-black tracking-wider bg-red-100 dark:bg-red-950/40 px-2 py-1 rounded">SHOOTOUT</span>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* CORE NAVIGATION TABS */}
      <nav className={`py-1.5 md:py-2 px-2 md:px-6 border-b transition-colors duration-300 shadow-card ${sunMode ? 'bg-white border-sand-155' : 'bg-charcoal-900 border-charcoal-800'
        }`}>
        <div className="max-w-7xl mx-auto grid grid-cols-5 md:flex md:justify-start md:gap-2 lg:gap-4 overflow-hidden">
          <button
            onClick={() => {
              if (currentPeriod === 'shootout') {
                changePeriod('set2');
              } else {
                setActiveTab('pista');
              }
            }}
            className={`py-3 md:py-4 px-1 md:px-5 rounded-lg font-bold text-[11px] md:text-base uppercase flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 border-b-2 transition-all duration-300 active:scale-[0.98] whitespace-nowrap overflow-hidden ${activeTab === 'pista'
              ? 'border-primary text-primary font-extrabold'
              : sunMode
                ? 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-sand-50/50'
                : 'border-transparent text-slate-300 hover:text-white hover:bg-charcoal-800/50'
              }`}
          >
            <span className="text-lg md:text-xl">📋</span> <span className="truncate">{t.tabMatch}</span>
          </button>

          <button
            onClick={() => changePeriod('shootout')}
            className={`py-3 md:py-4 px-1 md:px-5 rounded-lg font-bold text-[11px] md:text-base uppercase flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 border-b-2 transition-all duration-300 active:scale-[0.98] whitespace-nowrap overflow-hidden ${activeTab === 'shootout'
              ? 'border-primary text-primary font-extrabold'
              : sunMode
                ? 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-sand-50/50'
                : 'border-transparent text-slate-300 hover:text-white hover:bg-charcoal-800/50'
              }`}
          >
            <span className="text-lg md:text-xl">🎯</span> <span className="truncate">{t.tabShootout}</span>
          </button>

          <button
            onClick={() => setActiveTab('analisis')}
            className={`py-3 md:py-4 px-1 md:px-5 rounded-lg font-bold text-[11px] md:text-base uppercase flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 border-b-2 transition-all duration-300 active:scale-[0.98] whitespace-nowrap overflow-hidden ${activeTab === 'analisis'
              ? 'border-primary text-primary font-extrabold'
              : sunMode
                ? 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-sand-50/50'
                : 'border-transparent text-slate-300 hover:text-white hover:bg-charcoal-800/50'
              }`}
          >
            <span className="text-lg md:text-xl">📊</span> <span className="truncate">{t.tabAnalysis}</span>
          </button>

          <button
            onClick={() => setActiveTab('plantilla')}
            className={`py-3 md:py-4 px-1 md:px-5 rounded-lg font-bold text-[11px] md:text-base uppercase flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 border-b-2 transition-all duration-300 active:scale-[0.98] whitespace-nowrap overflow-hidden ${activeTab === 'plantilla'
              ? 'border-primary text-primary font-extrabold'
              : sunMode
                ? 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-sand-50/50'
                : 'border-transparent text-slate-300 hover:text-white hover:bg-charcoal-800/50'
              }`}
          >
            <span className="text-lg md:text-xl">👥</span> <span className="truncate">{t.tabTeam}</span>
          </button>

          <button
            onClick={() => setActiveTab('historial')}
            className={`py-3 md:py-4 px-1 md:px-5 rounded-lg font-bold text-[11px] md:text-base uppercase flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 border-b-2 transition-all duration-300 active:scale-[0.98] whitespace-nowrap overflow-hidden ${activeTab === 'historial'
              ? 'border-primary text-primary font-extrabold'
              : sunMode
                ? 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-sand-50/50'
                : 'border-transparent text-slate-300 hover:text-white hover:bg-charcoal-800/50'
              }`}
          >
            <span className="text-lg md:text-xl">☁️</span> <span className="truncate">{t.tabArchive}</span>
          </button>
        </div>
      </nav>

      {/* CORE VIEWPORT */}
      <main className="max-w-7xl mx-auto py-4 md:py-6 px-3 md:px-6 overflow-hidden">
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
          <AnalyticsHub matchState={matchState} sunMode={sunMode} />
        )}

        {activeTab === 'plantilla' && (
          <SetupTeam
            players={players}
            onUpdatePlayers={updatePlayers}
          />
        )}

        {activeTab === 'historial' && (
          <MatchHistory
            user={user}
            currentMatchState={matchState}
            onLoadMatch={(loadedState) => setMatchState(loadedState)}
            sunMode={sunMode}
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
              <h3 className="text-lg font-black uppercase tracking-wide">{t.resetMatch}</h3>
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
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={resetAllStats}
                className="py-2.5 px-5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs uppercase cursor-pointer tracking-wider shadow-sm transition active:scale-95 duration-100"
              >
                {t.yesReset}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA INSTALL BANNER - shown when not in standalone mode */}
      {!window.matchMedia('(display-mode: standalone)').matches && !showInstallButton && (
        <div className={`fixed bottom-4 left-3 right-3 md:left-auto md:right-4 md:max-w-sm z-50 p-4 md:p-5 rounded-2xl border-2 shadow-2xl transition-all ${sunMode
          ? 'bg-white border-emerald-200 text-slate-800'
          : 'bg-charcoal-900 border-emerald-700 text-slate-100'
          }`}
          id="ios-install-banner"
        >
          <button
            onClick={() => {
              const el = document.getElementById('ios-install-banner');
              if (el) el.style.display = 'none';
            }}
            className={`absolute top-2 right-2 p-1.5 rounded-lg text-xs ${sunMode ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
          >
            ✕
          </button>
          <div className="flex items-start gap-3">
            <DownloadCloud className={`w-8 h-8 flex-shrink-0 ${sunMode ? 'text-emerald-600' : 'text-emerald-400'}`} />
            <div>
              <p className="font-black text-sm md:text-base mb-1">Instalar BH Stats</p>
              <p className={`text-xs md:text-sm leading-relaxed ${sunMode ? 'text-slate-600' : 'text-slate-400'}`}>
                Para pantalla completa sin barra de direcciones:
                <br />
                <strong>Safari (iOS):</strong> Pulsa <span className="inline-block border px-1.5 py-0.5 rounded text-[10px] font-bold mx-0.5">Compartir ↑</span> → "Añadir a inicio"
                <br />
                <strong>Chrome:</strong> Menú ⋮ → "Instalar aplicación"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TUTORIAL */}
      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} sunMode={sunMode} />}

      {/* FOOTER ACCREDITATION AND LEGALITY */}
      <footer className={`py-4 px-4 text-center select-none transition-colors ${sunMode ? 'text-charcoal-500' : 'text-charcoal-500'
        }`}>
        <a
          href="mailto:iatpro74@gmail.com?subject=BH%20Stats%20-%20Sugerencia&body=Hola%2C%20tengo%20una%20sugerencia%3A%0A%0A"
          className={`inline-block text-xs font-bold mb-2 px-3 py-1.5 rounded-lg border transition active:scale-95 ${sunMode
            ? 'text-blue-600 border-blue-200 hover:bg-blue-50'
            : 'text-blue-400 border-blue-800 hover:bg-blue-950/30'
          }`}
        >
          💬 {language === 'en' ? 'Suggestions' : language === 'ca' ? 'Suggeriments' : 'Sugerencias'}
        </a>
        <p className="text-[10px] font-bold uppercase tracking-widest">
          © 2026 IAtpro74
        </p>
      </footer>
    </div>
  );
}

