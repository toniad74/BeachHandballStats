import React, { useState, useEffect, useRef } from 'react';
import { Player, MatchState, SetState, EventLog, Possession } from '../types';
import { Play, Pause, RotateCcw, AlertTriangle, ShieldCheck, Heart, RefreshCw, VolumeX, Undo2, Users, X } from 'lucide-react';
import { SHIRT_COLORS } from '../utils/initialState';
import { useI18n } from '../i18n';
import { translatePosition } from '../utils/i18n';

interface GameBoardProps {
  matchState: MatchState;
  ourShirtColor: string;
  ourGkShirtColor: string;
  opponentShirtColor: string;
  onUpdateMatchState: (state: MatchState) => void;
  sunMode: boolean;
  changePeriod: (period: 'set1' | 'set2' | 'shootout') => void;
  onUpdateColorsAndNames: (config: {
    ourTeamName: string;
    opponentName: string;
    ourShirtColor: string;
    ourGkShirtColor: string;
    opponentShirtColor: string;
  }) => void;
}

export default function GameBoard({
  matchState,
  ourShirtColor,
  ourGkShirtColor,
  opponentShirtColor,
  onUpdateMatchState,
  sunMode,
  changePeriod,
  onUpdateColorsAndNames,
}: GameBoardProps) {
  const { currentPeriod, players, opponentName, activePossession, passivePasses, shootoutRounds } = matchState;
  const ourTeamName = matchState.ourTeamName || 'Nuestro Equipo';
  const { t } = useI18n();
  
  const currentSetState: SetState = currentPeriod === 'set1' ? matchState.set1 : matchState.set2;
  
  // Game Timer States
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerResetConfirm, setTimerResetConfirm] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Time Edit Modal States
  const [showTimeEditModal, setShowTimeEditModal] = useState(false);
  const [editMinutes, setEditMinutes] = useState(10);
  const [editSeconds, setEditSeconds] = useState(0);

  // Time Out Timer States
  const [ttoRemaining, setTtoRemaining] = useState(60);
  const [ttoActive, setTtoActive] = useState(false);
  const [ttoTeam, setTtoTeam] = useState<Possession | null>(null);
  const ttoTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedPlayerForActions, setSelectedPlayerForActions] = useState<Player | null>(null);

  const [lastUndoneMessage, setLastUndoneMessage] = useState<string | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Visual feedback state
  const [feedbackPlayerId, setFeedbackPlayerId] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'warning' | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerFeedback = (playerId: string, type: 'success' | 'error' | 'warning') => {
    // Haptic vibration (if supported)
    if (navigator.vibrate) {
      navigator.vibrate(type === 'success' ? 50 : type === 'error' ? [50, 30, 50] : 30);
    }
    // Visual flash
    setFeedbackPlayerId(playerId);
    setFeedbackType(type);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedbackPlayerId(null);
      setFeedbackType(null);
    }, 600);
  };

  const [teamConfigModalType, setTeamConfigModalType] = useState<'us' | 'them' | null>(null);
  const [showAssistModal, setShowAssistModal] = useState(false);
  const [pendingGoalScorer, setPendingGoalScorer] = useState<Player | null>(null);
  const [tempTeamName, setTempTeamName] = useState('');
  const [tempShirtColor, setTempShirtColor] = useState('');

  // Rival Exclusion States
  const [rivalExclusions, setRivalExclusions] = useState<{ id: string; dorsal: string }[]>([]);
  const [showRivalExclusionModal, setShowRivalExclusionModal] = useState(false);
  const [rivalExclusionDorsal, setRivalExclusionDorsal] = useState('');

  // Opponent +2 Goal Type Modal
  const [showOpponent2pModal, setShowOpponent2pModal] = useState(false);
  const [opponent2pTargetPlayer, setOpponent2pTargetPlayer] = useState<Player | null>(null);

  const openTeamConfigModal = (team: 'us' | 'them') => {
    setTeamConfigModalType(team);
    if (team === 'us') {
      setTempTeamName(ourTeamName);
      setTempShirtColor(ourShirtColor);
    } else {
      setTempTeamName(opponentName);
      setTempShirtColor(opponentShirtColor);
    }
  };

  const handleSaveTeamConfig = () => {
    if (teamConfigModalType === 'us') {
      onUpdateColorsAndNames({
        ourTeamName: tempTeamName,
        opponentName: opponentName,
        ourShirtColor: tempShirtColor,
        ourGkShirtColor: ourGkShirtColor,
        opponentShirtColor: opponentShirtColor,
      });
    } else {
      onUpdateColorsAndNames({
        ourTeamName: ourTeamName,
        opponentName: tempTeamName,
        ourShirtColor: ourShirtColor,
        ourGkShirtColor: ourGkShirtColor,
        opponentShirtColor: tempShirtColor,
      });
    }
    setTeamConfigModalType(null);
  };
  const [logs, setLogs] = useState<EventLog[]>(matchState.historyEvents || []);

  // Sync internal logs to matchState history
  useEffect(() => {
    onUpdateMatchState({
      ...matchState,
      historyEvents: logs,
    });
  }, [logs]);

  // Main Game Timer Tick
  useEffect(() => {
    if (isTimerRunning && timeRemaining > 0 && !ttoActive) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            clearInterval(timerRef.current!);
            handleSetTimeFinished();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timeRemaining, ttoActive]);

  // TTO Timer Tick
  useEffect(() => {
    if (ttoActive && ttoRemaining > 0) {
      ttoTimerRef.current = setInterval(() => {
        setTtoRemaining((prev) => {
          if (prev <= 1) {
            setTtoActive(false);
            clearInterval(ttoTimerRef.current!);
            addLog('Tiempo Muerto finalizado.', 'system');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (ttoTimerRef.current) clearInterval(ttoTimerRef.current);
    }
    return () => {
      if (ttoTimerRef.current) clearInterval(ttoTimerRef.current);
    };
  }, [ttoActive, ttoRemaining]);

  // Check 15 seconds warning rule
  const isLast15Seconds = timeRemaining > 0 && timeRemaining <= 15;

  // Audio alert when entering last 15 seconds
  const alertPlayedRef = useRef(false);
  useEffect(() => {
    if (isLast15Seconds && isTimerRunning && !alertPlayedRef.current) {
      alertPlayedRef.current = true;
      // Play a short beep using Web Audio API
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 1000;
        gain.gain.value = 0.3;
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
        // Second beep
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.value = 1200;
          gain2.gain.value = 0.3;
          osc2.start();
          osc2.stop(ctx.currentTime + 0.3);
        }, 400);
      } catch (e) { /* Audio not available */ }
      // Also vibrate
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
    }
    if (timeRemaining > 15) {
      alertPlayedRef.current = false;
    }
  }, [isLast15Seconds, isTimerRunning, timeRemaining]);

  const currentSetKey: 'set1' | 'set2' = currentPeriod === 'set1' ? 'set1' : 'set2';

  // Format mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getShirtStyle = (hex: string) => {
    return SHIRT_COLORS.find((c) => c.hex === hex) || SHIRT_COLORS[0];
  };

  const addLog = (description: string, type: EventLog['type']) => {
    const newLog: EventLog = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: formatTime(600 - timeRemaining),
      period: currentPeriod,
      description,
      type,
    };
    setLogs((prev) => [newLog, ...prev].slice(0, 50));
  };

  // Set timeout has completed
  const handleSetTimeFinished = () => {
    const currentSet = matchState[currentSetKey];
    if (currentSet.usScore === currentSet.themScore) {
      // Golden Goal triggered
      onUpdateMatchState({
        ...matchState,
        [currentSetKey]: {
          ...currentSet,
          isGoldenGoal: true,
        },
      });
      addLog('¡Empate al final del set! Activado modo {t.goldenGoal}.', 'system');
    } else {
      // Set Finished
      const winner = currentSet.usScore > currentSet.themScore ? 'us' : 'them';
      onUpdateMatchState({
        ...matchState,
        [currentSetKey]: {
          ...currentSet,
          isFinished: true,
          winner,
        },
      });
      addLog(`¡Fin del Set! Ganador del set: ${winner === 'us' ? ourTeamName : opponentName}`, 'system');
    }
  };

  // Change Possession
  const togglePossession = (forcedValue?: Possession) => {
    const nextPossession: Possession = forcedValue !== undefined ? forcedValue : (activePossession === 'us' ? 'them' : 'us');
    
    // Clear passive play warnings
    const nextState: MatchState = { ...matchState, activePossession: nextPossession, passivePasses: null };
    
    // RULE 2026 update: "Una Posesión" Rule.
    // If possession changes (either regaining it, or passing it to opponent), the players we had excluded can now re-enter.
    // Transition (change of possession attack/defense) fulfills the "Una Posesión" exclusion.
    let updatedPlayers = players.map((p) => {
      if (p.isSuspended && !p.isDisqualified) {
        addLog(`Sanción cumplida para ${p.name} al cambiar la posesión.`, 'system');
        return { ...p, isSuspended: false };
      }
      return p;
    });

    nextState.players = updatedPlayers;

    onUpdateMatchState(nextState);
    addLog(`Posesión: ${nextPossession === 'us' ? 'Balón recuperado' : 'Posesión rival'}`, 'system');
  };

  // Standard point addition (+1 Goal)
  const addPoint1 = (player: Player) => {
    // 1-point standard goal
    const updatedPlayers = players.map((p) => {
      if (p.id === player.id) {
        return { ...p, goals1p: p.goals1p + 1 };
      }
      return p;
    });

    const currentSet = matchState[currentSetKey];
    const newUsScore = currentSet.usScore + 1;
    
    // Check Golden Goal rule
    let setFinished = currentSet.isFinished;
    let setWinner = currentSet.winner;
    if (currentSet.isGoldenGoal) {
      setFinished = true;
      setWinner = 'us';
      setIsTimerRunning(false);
      addLog(`¡{t.goldenGoal}! Gol anotado por ${player.name} de 1 pt. victoria del set!`, 'goal_us');
    } else {
      addLog(`Gol de ${player.name} (1 punto)`, 'goal_us');
    }

    onUpdateMatchState({
      ...matchState,
      players: updatedPlayers,
      [currentSetKey]: {
        ...currentSet,
        usScore: newUsScore,
        isFinished: setFinished,
        winner: setWinner,
      },
    });
    triggerFeedback(player.id, 'success');
    // Show assist modal
    setPendingGoalScorer(player);
    setShowAssistModal(true);
    setSelectedPlayerForActions(null);
  };

  // Creative 2-Point play
  const addPoint2 = (player: Player, type: 'Portero_Especialista' | 'Fly' | 'Giro' | 'Penalti') => {
    const updatedPlayers = players.map((p) => {
      if (p.id === player.id) {
        return {
          ...p,
          goals2p: p.goals2p + 1,
          goalsFlies: (p.goalsFlies || 0) + (type === 'Fly' ? 1 : 0),
          goalsSpins: (p.goalsSpins || 0) + (type === 'Giro' ? 1 : 0),
          goalsPenalties: (p.goalsPenalties || 0) + (type === 'Penalti' ? 1 : 0),
        };
      }
      return p;
    });

    const currentSet = matchState[currentSetKey];
    const newUsScore = currentSet.usScore + 2;

    // Check Golden Goal rule
    let setFinished = currentSet.isFinished;
    let setWinner = currentSet.winner;
    
    let typeLabel = '';
    switch (type) {
      case 'Portero_Especialista': typeLabel = 'Gol Portero/Especialista'; break;
      case 'Fly': typeLabel = 'Fly (In-Flight)'; break;
      case 'Giro': typeLabel = 'Efecto 360°'; break;
      case 'Penalti': typeLabel = 'Lanzamiento 6m'; break;
    }

    if (currentSet.isGoldenGoal) {
      setFinished = true;
      setWinner = 'us';
      setIsTimerRunning(false);
      addLog(`¡{t.goldenGoal}! ${player.name} anota un ${typeLabel} (2 ptos) ¡Set ganado!`, 'goal_us');
    } else {
      addLog(`Gol Doble de ${player.name} vía ${typeLabel} (2 puntos)`, 'goal_us');
    }

    onUpdateMatchState({
      ...matchState,
      players: updatedPlayers,
      [currentSetKey]: {
        ...currentSet,
        usScore: newUsScore,
        isFinished: setFinished,
        winner: setWinner,
      },
    });
    triggerFeedback(player.id, 'success');
    // Show assist modal
    setPendingGoalScorer(player);
    setShowAssistModal(true);
    setSelectedPlayerForActions(null);
  };

  // Missed standard shot
  const logMissedShot = (player: Player) => {
    const updatedPlayers = players.map((p) => {
      if (p.id === player.id) {
        return { ...p, missedShots: p.missedShots + 1 };
      }
      return p;
    });

    onUpdateMatchState({ ...matchState, players: updatedPlayers });
    addLog(`Tiro fallado por ${player.name}`, 'miss_us');
    triggerFeedback(player.id, 'error');
  };

  // Missed Fly shot (highly valued tactical metric requested)
  const logMissedFly = (player: Player) => {
    const updatedPlayers = players.map((p) => {
      if (p.id === player.id) {
        return { ...p, missedFlies: p.missedFlies + 1, missedShots: p.missedShots + 1 };
      }
      return p;
    });
    onUpdateMatchState({ ...matchState, players: updatedPlayers });
    addLog(`Fly fallado por ${player.name}`, 'miss_us');
    triggerFeedback(player.id, 'error');
  };

  // Missed Spin (Giro)
  const logMissedSpin = (player: Player) => {
    const updatedPlayers = players.map((p) => {
      if (p.id === player.id) {
        return { ...p, missedSpins: (p.missedSpins || 0) + 1, missedShots: p.missedShots + 1 };
      }
      return p;
    });
    onUpdateMatchState({ ...matchState, players: updatedPlayers });
    addLog(`Giro fallado por ${player.name}`, 'miss_us');
    triggerFeedback(player.id, 'error');
  };

  // Missed Penalty
  const logMissedPenalty = (player: Player) => {
    const updatedPlayers = players.map((p) => {
      if (p.id === player.id) {
        return { ...p, missedPenalties: (p.missedPenalties || 0) + 1, missedShots: p.missedShots + 1 };
      }
      return p;
    });
    onUpdateMatchState({ ...matchState, players: updatedPlayers });
    addLog(`Penalti fallado por ${player.name}`, 'miss_us');
    triggerFeedback(player.id, 'error');
  };

  // Log Turnovers breakdown
  const logTurnover = (player: Player, type: 'bad_pass' | 'steps' | 'fumbling') => {
    let updatedPlayers = players.map((p) => {
      if (p.id === player.id) {
        return {
          ...p,
          turnoverBadPass: p.turnoverBadPass + (type === 'bad_pass' ? 1 : 0),
          turnoverSteps: p.turnoverSteps + (type === 'steps' ? 1 : 0),
          turnoverFumbling: p.turnoverFumbling + (type === 'fumbling' ? 1 : 0),
        };
      }
      return p;
    });

    const nextPossession: Possession = 'them';

    let typeLabel = 'pérdida';
    if (type === 'bad_pass') typeLabel = 'Pase fallado';
    if (type === 'steps') typeLabel = 'Pasos';
    if (type === 'fumbling') typeLabel = 'Fumbling (Bote fallido)';
    
    addLog(`Pérdida de ${player.name}: ${typeLabel}`, 'turnover');

    // Clear suspensions on possession change
    updatedPlayers = updatedPlayers.map((p) => {
      if (p.isSuspended && !p.isDisqualified) {
        addLog(`Sanción cumplida para ${p.name} al cambiar la posesión.`, 'system');
        return { ...p, isSuspended: false };
      }
      return p;
    });

    addLog('Posesión cambiada: Posesión rival', 'system');

    onUpdateMatchState({
      ...matchState,
      activePossession: nextPossession,
      passivePasses: null,
      players: updatedPlayers
    });

    triggerFeedback(player.id, 'warning');
    setSelectedPlayerForActions(null);
  };

  // Log Recovery
  const logRecovery = (player: Player) => {
    let updatedPlayers = players.map((p) => {
      if (p.id === player.id) {
        return {
          ...p,
          recoveries: (p.recoveries || 0) + 1,
        };
      }
      return p;
    });

    addLog(`Recuperación de ${player.name}`, 'system');

    const nextPossession: Possession = 'us';

    // Clear suspensions on possession change
    updatedPlayers = updatedPlayers.map((p) => {
      if (p.isSuspended && !p.isDisqualified) {
        addLog(`Sanción cumplida para ${p.name} al cambiar la posesión.`, 'system');
        return { ...p, isSuspended: false };
      }
      return p;
    });

    addLog(`Posesión: Balón recuperado`, 'system');

    onUpdateMatchState({
      ...matchState,
      activePossession: nextPossession,
      passivePasses: null,
      players: updatedPlayers
    });

    setSelectedPlayerForActions(null);
  };

  // Play exclusion logic ("Una Posesión")
  const triggerExclusion = (player: Player) => {
    const nextExclusionCount = player.exclusions + 1;
    const isDisqualifiedNow = nextExclusionCount >= 2;

    const updatedPlayers = players.map((p) => {
      if (p.id === player.id) {
        return {
          ...p,
          exclusions: nextExclusionCount,
          isDisqualified: isDisqualifiedNow,
          isSuspended: !isDisqualifiedNow,
        };
      }
      return p;
    });

    onUpdateMatchState({
      ...matchState,
      players: updatedPlayers,
    });

    if (isDisqualifiedNow) {
      addLog(`¡Exclusión 2! Tarjeta Roja para ${player.name}. DESCALIFICADO.`, 'exclusion');
    } else {
      addLog(`Exclusión para ${player.name}. Posesión penalizada ("Una Posesión").`, 'exclusion');
    }
    setSelectedPlayerForActions(null);
  };

  // Direct red card / Disqualification logic
  const triggerDirectRedCard = (player: Player) => {
    const updatedPlayers = players.map((p) => {
      if (p.id === player.id) {
        return {
          ...p,
          exclusions: 2,
          isDisqualified: true,
        };
      }
      return p;
    });

    onUpdateMatchState({
      ...matchState,
      players: updatedPlayers,
    });

    addLog(`🟥 Tarjeta Roja Directa para ${player.name}. DESCALIFICADO.`, 'exclusion');
    setSelectedPlayerForActions(null);
  };

  // Rival exclusion logic
  const addRivalExclusion = () => {
    const dorsal = rivalExclusionDorsal.trim();
    if (!dorsal) return;
    const existingCount = rivalExclusions.filter(e => e.dorsal === dorsal).length;
    const newExclusion = { id: `rival-ex-${Date.now()}`, dorsal };
    setRivalExclusions(prev => [...prev, newExclusion]);
    if (existingCount >= 1) {
      addLog(`🟥 ¡TARJETA ROJA! Dorsal #${dorsal} del ${opponentName} — 2ª exclusión = DESCALIFICADO.`, 'exclusion');
    } else {
      addLog(`Exclusión rival: Dorsal #${dorsal} del ${opponentName}.`, 'exclusion');
    }
    setRivalExclusionDorsal('');
    setShowRivalExclusionModal(false);
  };

  const removeRivalExclusion = (id: string) => {
    setRivalExclusions(prev => prev.filter(e => e.id !== id));
  };

  // Predefined switches
  // Opponent Actions
  const logOpponentGoal = (pts: number, goalType?: string, targetPlayer?: Player | null) => {
    const currentSet = matchState[currentSetKey];
    const newThemScore = currentSet.themScore + pts;

    // Check Golden Goal rule
    let setFinished = currentSet.isFinished;
    let setWinner = currentSet.winner;
    if (currentSet.isGoldenGoal) {
      setFinished = true;
      setWinner = 'them';
      setIsTimerRunning(false);
      addLog(`¡{t.goldenGoal} Rival! El oponente anota y se lleva el set.`, 'goal_them');
    } else {
      const typeLabel = goalType ? ` (${goalType})` : '';
      const gkLabel = targetPlayer ? ` encajado por ${targetPlayer.name}` : '';
      addLog(`Gol del Oponente (${pts} punto/s${typeLabel})${gkLabel}`, 'goal_them');
    }

    // Attribute goal conceded to the target goalkeeper or active goalkeeper
    const goalkeeper = targetPlayer || 
                       players.find(p => p.position === 'Portero' && !p.isDisqualified) || 
                       players.find(p => p.position === 'Polivalente' && !p.isDisqualified);
    const updatedPlayers = goalkeeper 
      ? players.map(p => p.id === goalkeeper.id ? { ...p, goalsConceded: (p.goalsConceded || 0) + 1 } : p)
      : players;

    onUpdateMatchState({
      ...matchState,
      players: updatedPlayers,
      [currentSetKey]: {
        ...currentSet,
        themScore: newThemScore,
        isFinished: setFinished,
        winner: setWinner,
      },
    });
  };

  const logOpponentMiss = (targetPlayer?: Player | null) => {
    const gkLabel = targetPlayer ? ` con ${targetPlayer.name} en portería` : '';
    addLog(`Tiro fuera/poste del equipo rival${gkLabel}`, 'save');
  };

  const logOurGKSave = () => {
    // Find our main goalkeeper or fallback to Polivalente
    const goalkeeper = players.find(p => p.position === 'Portero' && !p.isDisqualified) || 
                       players.find(p => p.position === 'Polivalente' && !p.isDisqualified);
    
    let updatedPlayers = players;
    if (goalkeeper) {
      updatedPlayers = players.map(p => {
        if (p.id === goalkeeper.id) {
          return { ...p, saves: (p.saves || 0) + 1 };
        }
        return p;
      });
    }

    addLog(`¡ESPECTACULAR PARADA DE PORTERÍA! ${goalkeeper ? goalkeeper.name : ''}`, 'save');

    onUpdateMatchState({
      ...matchState,
      players: updatedPlayers
    });
  };

  // Interactive Team-Out Buttons
  const triggerTTO = (team: Possession) => {
    const currentSet = matchState[currentSetKey];
    if (team === 'us' && currentSet.usTTOUsed) return;
    if (team === 'them' && currentSet.themTTOUsed) return;

    // Trigger 1 minute timeout
    setTtoTeam(team);
    setTtoRemaining(60);
    setTtoActive(true);
    addLog(`Tiempo Muerto (${team === 'us' ? 'Nuestro' : 'Rival'}) solicitado. 60s iniciados.`, 'tto');

    // Update state to record used TTO
    onUpdateMatchState({
      ...matchState,
      [currentSetKey]: {
        ...currentSet,
        usTTOUsed: team === 'us' ? true : currentSet.usTTOUsed,
        themTTOUsed: team === 'them' ? true : currentSet.themTTOUsed,
      },
    });
  };

  // Passive play counter
  const handlePassiveClick = () => {
    if (passivePasses === null) {
      // Raise the hand / warning
      onUpdateMatchState({ ...matchState, passivePasses: 4 });
      addLog('¡ADVERTENCIA DE JUEGO PASIVO! Máximo 4 pases reglamentarios.', 'system');
    } else if (passivePasses > 1) {
      onUpdateMatchState({ ...matchState, passivePasses: passivePasses - 1 });
      addLog(`Pase realizado. Quedan ${passivePasses - 1} pases antes de pitar pasivo.`, 'system');
    } else {
      onUpdateMatchState({ ...matchState, passivePasses: 0 });
      addLog('¡Lanzamiento obligatorio en juego pasivo!', 'system');
    }
  };

  const resetPassivePlay = () => {
    onUpdateMatchState({ ...matchState, passivePasses: null });
  };

  const undoLastEvent = () => {
    if (logs.length === 0) return;
    const [lastLog, ...remainingLogs] = logs;
    setLogs(remainingLogs);

    // Set undone message for visual feedback
    setLastUndoneMessage(`Deshecho: ${lastLog.description}`);
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    undoTimeoutRef.current = setTimeout(() => {
      setLastUndoneMessage(null);
    }, 4000);

    // Simple robust reversal logic for live score and stats
    addLog(`Acción deshecha: ("${lastLog.description}")`, 'system');
    
    // In order to provide a reliable undo, we notify the coach and decrement appropriately
    const currentSet = matchState[currentSetKey];
    if (lastLog.type === 'goal_us') {
      const isTwoPts = lastLog.description.includes('2 puntos') || lastLog.description.includes('doble') || lastLog.description.includes('Fly') || lastLog.description.includes('Efecto') || lastLog.description.includes('Giro') || lastLog.description.includes('Penalti') || lastLog.description.includes('Portería') || lastLog.description.includes('Especialista');
      const pointsToSubtract = isTwoPts ? 2 : 1;
      
      const playerToRestore = players.find(p => lastLog.description.includes(p.name));
      const updatedPlayers = playerToRestore
        ? players.map(p => {
            if (p.id === playerToRestore.id) {
              return {
                ...p,
                goals1p: !isTwoPts ? Math.max(0, p.goals1p - 1) : p.goals1p,
                goals2p: isTwoPts ? Math.max(0, p.goals2p - 1) : p.goals2p,
              };
            }
            return p;
          })
        : players;

      onUpdateMatchState({
        ...matchState,
        players: updatedPlayers,
        [currentSetKey]: {
          ...currentSet,
          usScore: Math.max(0, currentSet.usScore - pointsToSubtract),
          isFinished: false,
          isGoldenGoal: false,
          winner: null,
        },
      });
    } else if (lastLog.type === 'goal_them') {
      const isTwoPts = lastLog.description.includes('2');
      const pointsToSubtract = isTwoPts ? 2 : 1;
      
      const goalkeeperToRestore = players.find(p => lastLog.description.includes(p.name)) ||
                                  players.find(p => p.position === 'Portero' && !p.isDisqualified) || 
                                  players.find(p => p.position === 'Polivalente' && !p.isDisqualified);
      
      const updatedPlayers = goalkeeperToRestore
        ? players.map(p => p.id === goalkeeperToRestore.id ? { ...p, goalsConceded: Math.max(0, (p.goalsConceded || 0) - 1) } : p)
        : players;

      onUpdateMatchState({
        ...matchState,
        players: updatedPlayers,
        [currentSetKey]: {
          ...currentSet,
          themScore: Math.max(0, currentSet.themScore - pointsToSubtract),
          isFinished: false,
          isGoldenGoal: false,
          winner: null,
        },
      });
    } else if (lastLog.type === 'exclusion') {
      if (lastLog.description.includes("Exclusión rival") || lastLog.description.includes("¡TARJETA ROJA! Dorsal")) {
        // Undo rival exclusion
        setRivalExclusions(prev => prev.slice(0, -1));
      } else {
        // Undo player exclusion
        const playerToRestore = players.find(p => lastLog.description.includes(p.name));
        if (playerToRestore) {
          const isDirectRed = lastLog.description.includes("Tarjeta Roja Directa");
          const prevExclusions = isDirectRed ? Math.max(0, playerToRestore.exclusions - 2) : Math.max(0, playerToRestore.exclusions - 1);
          
          const updatedPlayers = players.map(p => {
            if (p.id === playerToRestore.id) {
              return {
                ...p,
                exclusions: prevExclusions,
                isDisqualified: false,
                isSuspended: false
              };
            }
            return p;
          });
          
          onUpdateMatchState({
            ...matchState,
            players: updatedPlayers
          });
        }
      }
    } else if (lastLog.type === 'turnover') {
      const playerToRestore = players.find(p => lastLog.description.includes(p.name));
      if (playerToRestore) {
        const isBadPass = lastLog.description.includes("Pase fallado");
        const isSteps = lastLog.description.includes("Pasos");
        const isFumbling = lastLog.description.includes("Fumbling");
        const updatedPlayers = players.map(p => {
          if (p.id === playerToRestore.id) {
            return {
              ...p,
              turnoverBadPass: isBadPass ? Math.max(0, (p.turnoverBadPass || 0) - 1) : p.turnoverBadPass,
              turnoverSteps: isSteps ? Math.max(0, (p.turnoverSteps || 0) - 1) : p.turnoverSteps,
              turnoverFumbling: isFumbling ? Math.max(0, (p.turnoverFumbling || 0) - 1) : p.turnoverFumbling,
            };
          }
          return p;
        });
        onUpdateMatchState({ ...matchState, players: updatedPlayers });
      }
    } else if (lastLog.type === 'miss_us') {
      const playerToRestore = players.find(p => lastLog.description.includes(p.name));
      if (playerToRestore) {
        const isFly = lastLog.description.includes("Fly/Alley-oop");
        const updatedPlayers = players.map(p => {
          if (p.id === playerToRestore.id) {
            return {
              ...p,
              missedShots: Math.max(0, (p.missedShots || 0) - 1),
              missedFlies: isFly ? Math.max(0, (p.missedFlies || 0) - 1) : p.missedFlies,
            };
          }
          return p;
        });
        onUpdateMatchState({ ...matchState, players: updatedPlayers });
      }
    } else if (lastLog.type === 'save') {
      if (!lastLog.description.includes("Tiro fuera/poste")) {
        const playerToRestore = players.find(p => lastLog.description.includes(p.name));
        if (playerToRestore) {
          const updatedPlayers = players.map(p =>
            p.id === playerToRestore.id
              ? { ...p, saves: Math.max(0, (p.saves || 0) - 1) }
              : p
          );
          onUpdateMatchState({ ...matchState, players: updatedPlayers });
        }
      }
    } else if (lastLog.type === 'system' && lastLog.description.includes("Recuperación de")) {
      const playerToRestore = players.find(p => lastLog.description.includes(p.name));
      if (playerToRestore) {
        const updatedPlayers = players.map(p =>
          p.id === playerToRestore.id
            ? { ...p, recoveries: Math.max(0, (p.recoveries || 0) - 1) }
            : p
        );
        onUpdateMatchState({ ...matchState, players: updatedPlayers });
      }
    }
  };

  // Sort helper: Portero, Especialista & Polivalente always first
  const sortGkSpecFirst = (a: Player, b: Player) => {
    const priority = (p: Player) => {
      if (p.position === 'Portero') return 0;
      if (p.position === 'Especialista') return 1;
      if (p.position === 'Polivalente') return 2;
      return 3;
    };
    return priority(a) - priority(b);
  };

  // Time edit modal helpers
  const openTimeEditModal = () => {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    setEditMinutes(mins);
    setEditSeconds(secs);
    setShowTimeEditModal(true);
  };

  const handleSaveTimeEdit = () => {
    const totalSeconds = Math.max(0, Math.min(600, editMinutes * 60 + editSeconds));
    setTimeRemaining(totalSeconds);
    setShowTimeEditModal(false);
    addLog(`Tiempo ajustado manualmente a ${formatTime(totalSeconds)}.`, 'system');
  };

  // Register assist
  const registerAssist = (assister: Player | null) => {
    if (assister && pendingGoalScorer) {
      const updatedPlayers = players.map(p => {
        if (p.id === assister.id) {
          return { ...p, assists: (p.assists || 0) + 1 };
        }
        return p;
      });
      onUpdateMatchState({ ...matchState, players: updatedPlayers });
      addLog(`Asistencia de ${assister.name} para gol de ${pendingGoalScorer.name}`, 'system');
    }
    setShowAssistModal(false);
    setPendingGoalScorer(null);
  };

  return (
    <div className={`p-2 md:p-5 space-y-4 md:space-y-6 overflow-hidden ${isLast15Seconds ? 'ring-8 ring-red-600 animate-pulse duration-700 bg-red-10/20 rounded-xl' : ''}`} id="game_board_canvas">
      
      {/* 15 SECONDS ULTRA ALERT PANEL */}
      {isLast15Seconds && (
        <div className="bg-red-600 text-white font-black text-center py-2 px-4 rounded-lg shadow-lg flex items-center justify-center gap-3 relative overflow-hidden animate-bounce border-2 border-white">
          <AlertTriangle className="w-6 h-6 animate-spin" />
          <span className="uppercase text-sm sm:text-base tracking-wide">
            {t.last15sec}
          </span>
        </div>
      )}

      {/* SCORE PANEL AND SAND SANCTION PANELS IN A SINGLE ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* GAME TIME BOARD & LOGS CARDS */}
        <div className={`w-full border-3 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between transition-colors ${
          sunMode 
            ? 'bg-white border-sand-300 text-charcoal-900' 
            : 'bg-charcoal-900 border-charcoal-700 text-sand-50'
        }`}>
          <div className={`p-2 grid grid-cols-1 sm:grid-cols-3 justify-items-center items-center border-b gap-2 transition-colors ${
            sunMode ? 'bg-sand-50 border-sand-200' : 'bg-charcoal-950 border-charcoal-800'
          }`}>
            {/* Period / Mode indicator (Column 1 - Left) */}
            <div className="sm:justify-self-start flex items-center gap-2">
              <select
                value={currentPeriod}
                onChange={(e) => changePeriod(e.target.value as 'set1' | 'set2' | 'shootout')}
                className={`font-black text-xs px-2 py-1 rounded uppercase tracking-wider cursor-pointer border transition-colors outline-none ${
                  sunMode 
                    ? 'bg-charcoal-900 text-white border-charcoal-800 hover:bg-charcoal-800' 
                    : 'bg-sand-100 text-charcoal-900 border-sand-200 hover:bg-sand-200'
                }`}
              >
                <option value="set1" className={sunMode ? 'text-white bg-charcoal-900' : 'text-charcoal-900 bg-sand-100'}>Set 1</option>
                <option value="set2" className={sunMode ? 'text-white bg-charcoal-900' : 'text-charcoal-900 bg-sand-100'}>Set 2</option>
                <option value="shootout" className={sunMode ? 'text-white bg-charcoal-900' : 'text-charcoal-900 bg-sand-100'}>Shootout</option>
              </select>
              {currentSetState.isGoldenGoal && (
                <span className="bg-warning text-white font-extrabold text-xs px-2.5 py-1 rounded uppercase tracking-widest animate-pulse">
                  {t.goldenGoal}
                </span>
              )}
            </div>

            {/* LIVE DIGITAL GAME TIMER (Column 2 - Absolute Center) */}
            <div
              className="text-center flex flex-col items-center sm:justify-self-center cursor-pointer group"
              onClick={openTimeEditModal}
              title="Clic para editar el tiempo"
            >
              <span className={`text-3xl md:text-5xl font-mono font-extrabold tracking-widest transition-opacity group-hover:opacity-70 ${isLast15Seconds ? 'text-danger font-extrabold' : sunMode ? 'text-charcoal-900' : 'text-amber-gold'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>

            {/* TIMING CONTROL BUTTONS (Column 3 - Right) */}
            <div className="sm:justify-self-end">
              <div className={`flex gap-1 p-1 rounded-lg border transition-colors ${
                sunMode ? 'bg-sand-105 border-sand-200 bg-white' : 'bg-charcoal-800 border-charcoal-700'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`p-1.5 rounded-md font-bold transition duration-150 ${
                    isTimerRunning ? 'bg-danger text-white hover:bg-danger-hover' : 'bg-[#10B981] text-white hover:bg-emerald-600'
                  }`}
                  title={isTimerRunning ? 'Pausar' : 'Iniciar'}
                >
                  {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setTimerResetConfirm(true)}
                  className={`p-1.5 rounded-md transition-all duration-150 select-none ${
                    sunMode
                      ? 'hover:bg-sand-250 text-charcoal-650'
                      : 'hover:bg-charcoal-700 text-sand-300'
                  }`}
                  title="Reiniciar a 10:00"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* CORE LIVE SCORING VIEW */}
          <div className={`p-3 flex justify-center items-center gap-6 sm:gap-16 transition-colors border-t h-full ${
            sunMode ? 'bg-sand-50 border-sand-200' : 'bg-charcoal-950 border-charcoal-855'
          }`}>
            {/* US TEAM */}
            <div className="text-center flex-1 max-w-[200px] min-w-0">
              <button
                type="button"
                onClick={() => openTeamConfigModal('us')}
                className={`block w-full text-center hover:text-amber-500 transition-colors pb-1 border-b mb-1.5 text-xs md:text-sm uppercase font-black tracking-wider cursor-pointer truncate ${
                  sunMode ? 'text-charcoal-500 border-sand-200' : 'text-charcoal-400 border-zinc-800'
                }`}
                title="Configurar nombre y color de Nuestro Equipo"
              >
                {ourTeamName} ⚙️
              </button>
              <div 
                onClick={() => openTeamConfigModal('us')}
                className="flex justify-center items-center gap-1.5 cursor-pointer hover:opacity-85 transition-opacity"
                title="Configurar nombre y color de Nuestro Equipo"
              >
                <div className="w-4 h-4 md:w-5 md:h-5 rounded-full border border-black/20" style={{ backgroundColor: ourShirtColor }} />
                <span className={`text-5xl md:text-6xl font-mono font-black ${sunMode ? 'text-charcoal-900' : 'text-white'}`}>
                  {currentSetState.usScore}
                </span>
              </div>
            </div>

            {/* SEPARATOR VS */}
            <div className={`font-black text-lg tracking-wider select-none flex-shrink-0 ${sunMode ? 'text-sand-400' : 'text-charcoal-600'}`}>
              VS
            </div>

            {/* THEM TEAM */}
            <div className="text-center flex-1 max-w-[200px] min-w-0">
              <button
                type="button"
                onClick={() => openTeamConfigModal('them')}
                className={`block w-full text-center hover:text-amber-500 transition-colors pb-1 border-b mb-1.5 text-xs md:text-sm uppercase font-black tracking-wider cursor-pointer truncate ${
                  sunMode ? 'text-charcoal-500 border-sand-200' : 'text-charcoal-400 border-zinc-800'
                }`}
                title="Configurar nombre y color del Equipo Rival"
              >
                {opponentName} ⚙️
              </button>
              <div 
                onClick={() => openTeamConfigModal('them')}
                className="flex justify-center items-center gap-1.5 cursor-pointer hover:opacity-85 transition-opacity"
                title="Configurar nombre y color del Equipo Rival"
              >
                <span className={`text-5xl md:text-6xl font-mono font-black ${sunMode ? 'text-[#E11D48]' : 'text-[#F59E0B]'}`}>
                  {currentSetState.themScore}
                </span>
                <div className="w-4 h-4 md:w-5 md:h-5 rounded-full border border-black/20" style={{ backgroundColor: opponentShirtColor }} />
              </div>
            </div>
          </div>
        </div>

        {/* EXCLUDED PLAYERS & SANCIONES PANEL */}
        <div className={`w-full border rounded-2xl p-3 transition-colors overflow-hidden ${
          sunMode ? 'bg-white border-sand-300 text-charcoal-900 shadow-xs' : 'bg-charcoal-900 border-charcoal-800 text-sand-50'
        }`}>
          <div className="flex flex-col justify-between h-full">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center justify-between">
                <span className={sunMode ? 'text-charcoal-600' : 'text-charcoal-400'}>{t.excluded}</span>
              </p>
              
              {players.filter(p => p.isSuspended && !p.isDisqualified).length === 0 && rivalExclusions.length === 0 ? (
                <p className="text-xs text-charcoal-500 py-4 text-center font-bold bg-sand-50/50 dark:bg-charcoal-950/20 rounded-xl border border-dashed border-sand-200 dark:border-charcoal-800 animate-fade-in">
                  {t.noneFullStrength}
                </p>
              ) : (
                <div className="space-y-1">
                  {players.filter(p => p.isSuspended && !p.isDisqualified).map(p => (
                    <div key={`ex-${p.id}`} className={`border rounded-lg p-2.5 flex justify-between items-center ${
                      sunMode ? 'bg-[#FCFAF6] border-sand-200' : 'bg-charcoal-950 border-danger/30'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] text-white" style={{ backgroundColor: ourShirtColor }}>
                          {p.number}
                        </div>
                        <span className={`text-sm font-bold ${sunMode ? 'text-charcoal-900' : 'text-zinc-200'}`}>{p.name}</span>
                      </div>
                      <span className="bg-warning text-white font-bold text-[10px] px-2 py-0.5 rounded uppercase animate-pulse">
                        {t.sanctioned}
                      </span>
                    </div>
                  ))}
                  {/* Group rival exclusions by dorsal */}
                  {Object.entries(
                    rivalExclusions.reduce<Record<string, { count: number; ids: string[] }>>((acc, ex) => {
                      if (!acc[ex.dorsal]) acc[ex.dorsal] = { count: 0, ids: [] };
                      acc[ex.dorsal].count++;
                      acc[ex.dorsal].ids.push(ex.id);
                      return acc;
                    }, {})
                  ).map(([dorsal, _info]) => {
                    const info = _info as { count: number; ids: string[] };
                    const isRedCard = info.count >= 2;
                    return (
                      <div key={`rival-group-${dorsal}`} className={`border rounded-lg p-2.5 flex justify-between items-center ${
                        isRedCard
                          ? (sunMode ? 'bg-red-50 border-red-400' : 'bg-red-950/30 border-red-600/50')
                          : (sunMode ? 'bg-slate-50 border-slate-300' : 'bg-charcoal-950 border-slate-600/40')
                      }`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] text-white ${isRedCard ? 'animate-pulse' : ''}`} style={{ backgroundColor: isRedCard ? '#dc2626' : opponentShirtColor }}>
                            {dorsal}
                          </div>
                          <span className={`text-sm font-bold ${sunMode ? 'text-charcoal-700' : 'text-zinc-300'}`}>{opponentName} #{dorsal}</span>
                          {info.count > 1 && (
                            <span className={`text-[10px] font-bold ${sunMode ? 'text-charcoal-500' : 'text-zinc-400'}`}>({info.count}x)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isRedCard ? (
                            <span className="bg-red-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded uppercase animate-pulse shadow-sm">
                              🟥 Tarjeta Roja
                            </span>
                          ) : (
                            <span className="bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-extrabold text-[10px] px-2 py-0.5 rounded uppercase border border-red-500/20">
                              Exclusión
                            </span>
                          )}
                          <button
                            onClick={() => info.ids.forEach(id => removeRivalExclusion(id))}
                            className={`p-1 rounded-md transition-colors hover:bg-red-500 hover:text-white ${
                              sunMode ? 'text-slate-400' : 'text-slate-500'
                            }`}
                            title="Eliminar (corrección de error)"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Botón Exclusión Rival */}
              <button
                onClick={() => { setRivalExclusionDorsal(''); setShowRivalExclusionModal(true); }}
                className={`mt-3 w-full py-2 rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95 border ${
                  sunMode
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-charcoal-800 hover:bg-charcoal-750 text-sand-100 border-charcoal-700'
                }`}
              >
                + Exclusión Rival
              </button>

            </div>
          </div>
        </div>
      </div>

      {/* TACTICAL ACTION PANEL: UNIFIED ROSTER GRID */}
      <div className={`border-3 rounded-2xl shadow-xs p-3 md:p-6 transition-colors overflow-hidden ${
        sunMode ? 'bg-white border-sand-300' : 'bg-charcoal-900 border-charcoal-750'
      }`}>
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3 md:pb-4 mb-4 md:mb-5 gap-3 ${
          sunMode ? 'border-sand-200' : 'border-charcoal-800'
        }`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 md:w-8 md:h-8 text-[#10B981]" />
            <div>
              <h3 
                className={`text-lg md:text-xl font-black uppercase tracking-tight flex items-center gap-2 ${sunMode ? 'text-charcoal-900' : 'text-sand-50'}`}
              >
                {t.convocados}
              </h3>
              <p className={`text-xs md:text-sm ${sunMode ? 'text-charcoal-500' : 'text-charcoal-405'}`}>
                {t.selectPlayerDesc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {lastUndoneMessage && (
              <span className="text-[10px] md:text-[11px] font-bold text-amber-600 dark:text-amber-500 bg-amber-500/10 py-1 px-2 rounded-lg border border-amber-500/25 animate-fade-in truncate max-w-[200px]">
                {lastUndoneMessage}
              </span>
            )}
            {logs.length > 0 && (
              <button
                onClick={undoLastEvent}
                className="flex items-center gap-1 text-danger hover:text-danger-hover text-[11px] md:text-xs font-extrabold border border-danger/35 rounded px-2 md:px-2.5 py-1.5 transition-colors active:scale-95 bg-danger/5 dark:bg-danger/10 flex-shrink-0 whitespace-nowrap"
              >
                <Undo2 className="w-3.5 h-3.5" />
                {t.undo}
              </button>
            )}
          </div>
        </div>

        {/* UNIFIED ROSTER GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4" id="unified_roster_grid">
          {players.slice().sort(sortGkSpecFirst).map((player) => {
            const isGKOrEspecialista = player.position === 'Portero' || player.position === 'Especialista' || player.position === 'Polivalente';
            const teamColor = isGKOrEspecialista ? ourGkShirtColor : ourShirtColor;
            const textStyle = getShirtStyle(teamColor).text;
            
            // Status indicators
            const isCurrentlySuspended = player.isSuspended;
            const isCurrentlyDisqualified = player.isDisqualified;

            // Stat summaries
            const totalGoals = player.goals1p + (player.goals2p * 2);
            const totalTurnovers = (player.turnoverBadPass || 0) + (player.turnoverSteps || 0) + (player.turnoverFumbling || 0);
            const totalSaves = player.saves || 0;
            const totalRecoveries = player.recoveries || 0;
            const totalMisses = player.missedShots || 0;

            let cardBgClass = '';
            if (isCurrentlyDisqualified) {
              cardBgClass = sunMode ? 'bg-red-50 border-red-300 opacity-60' : 'bg-red-950/20 border-red-900/40 opacity-65';
            } else if (isCurrentlySuspended) {
              cardBgClass = sunMode ? 'bg-amber-50 border-amber-300 animate-pulse' : 'bg-amber-950/20 border-amber-900/40 animate-pulse';
            } else if (sunMode) {
              if (player.position === 'Portero') {
                cardBgClass = 'bg-amber-gold-bg border-amber-400';
              } else if (player.position === 'Especialista') {
                cardBgClass = 'bg-specialist-bg border-purple-400';
              } else if (player.position === 'Polivalente') {
                cardBgClass = 'bg-teal-50/75 border-teal-400';
              } else {
                cardBgClass = 'bg-[#FCFAF6] border-sand-200';
              }
            } else {
              if (player.position === 'Portero') {
                cardBgClass = 'bg-charcoal-800 border-amber-500/50';
              } else if (player.position === 'Especialista') {
                cardBgClass = 'bg-charcoal-800 border-purple-500/50';
              } else if (player.position === 'Polivalente') {
                cardBgClass = 'bg-charcoal-800 border-teal-500/50';
              } else {
                cardBgClass = 'bg-charcoal-900 border-charcoal-750';
              }
            }

            return (
              <div
                key={`roster-card-${player.id}`}
                onClick={() => {
                  if (!isCurrentlyDisqualified) {
                    setSelectedPlayerForActions(player);
                  }
                }}
                className={`border-2 rounded-xl relative p-4 md:p-5 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-3xs ${cardBgClass} ${
                  feedbackPlayerId === player.id && feedbackType === 'success' ? 'ring-4 ring-emerald-500 scale-[1.03]' :
                  feedbackPlayerId === player.id && feedbackType === 'error' ? 'ring-4 ring-red-500 scale-[1.03]' :
                  feedbackPlayerId === player.id && feedbackType === 'warning' ? 'ring-4 ring-amber-500 scale-[1.03]' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 md:w-10 md:h-10 rounded-full font-black text-sm md:text-base flex items-center justify-center border border-white/40 flex-shrink-0 ${textStyle}`}
                      style={{ backgroundColor: teamColor }}
                    >
                      {player.number}
                    </div>
                    <div className="leading-none min-w-0">
                      <p className={`font-extrabold text-sm md:text-base truncate ${sunMode ? 'text-charcoal-900' : 'text-sand-50'}`}>
                        {player.name}
                      </p>
                      <span className={`text-[10px] md:text-xs uppercase font-black truncate block mt-0.5 ${
                        player.position === 'Portero'
                          ? 'text-amber-600 dark:text-[#F59E0B]'
                          : player.position === 'Especialista'
                          ? 'text-purple-600 dark:text-purple-400'
                          : player.position === 'Polivalente'
                          ? 'text-teal-600 dark:text-teal-400'
                          : 'text-primary dark:text-primary-focus'
                      }`}>
                        {translatePosition(player.position, t)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats summary row */}
                <div className="flex flex-wrap gap-1.5 mt-1.5 text-[10px] md:text-xs font-bold">
                  {totalGoals > 0 && (
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                      ⚽ {totalGoals} pts
                    </span>
                  )}
                  {totalTurnovers > 0 && (
                    <span className="bg-red-500/10 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">
                      ⚠️ {totalTurnovers} Pérd
                    </span>
                  )}
                  {totalSaves > 0 && (
                    <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                      🧤 {totalSaves} Par
                    </span>
                  )}
                  {(player.goalsConceded || 0) > 0 && (
                    <span className="bg-red-500/10 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">
                      🥅 {player.goalsConceded} Enc
                    </span>
                  )}
                  {totalRecoveries > 0 && (
                    <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">
                      🟢 {totalRecoveries} Rec
                    </span>
                  )}
                  {totalMisses > 0 && (
                    <span className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded">
                      ❌ {totalMisses} Err
                    </span>
                  )}
                  {totalGoals === 0 && totalTurnovers === 0 && totalSaves === 0 && (player.goalsConceded || 0) === 0 && totalRecoveries === 0 && totalMisses === 0 && (
                    <span className="text-gray-405 italic">{t.noActions}</span>
                  )}
                </div>

                {/* Status badges */}
                {isCurrentlyDisqualified && (
                  <div className="absolute top-1 right-1 bg-red-600 text-white font-black text-[8px] px-1 rounded uppercase tracking-wider">
                    {t.disqualified}
                  </div>
                )}
                {isCurrentlySuspended && (
                  <div className="absolute top-1 right-1 bg-amber-500 text-gray-900 font-black text-[8px] px-1 rounded uppercase tracking-wider animate-pulse">
                    Sancionado
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: Tipo de Gol +2 del Rival */}
      {showOpponent2pModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`p-6 rounded-2xl max-w-sm w-full shadow-2xl border-2 transition-all ${
            sunMode 
              ? 'bg-[#FCFAF6] border-sand-300 text-zinc-900 shadow-xl' 
              : 'bg-zinc-900 border-zinc-700 text-zinc-50 shadow-2xl'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3 mb-4 border-sand-200 dark:border-zinc-800">
              <h3 className="text-sm font-black uppercase tracking-tight">
                {opponent2pTargetPlayer 
                  ? `Gol Recibido por ${opponent2pTargetPlayer.name} (+2)` 
                  : 'Tipo de Gol Rival (+2)'}
              </h3>
              <button
                onClick={() => {
                  setShowOpponent2pModal(false);
                  setOpponent2pTargetPlayer(null);
                }}
                className={`p-1.5 rounded-lg border transition ${
                  sunMode 
                    ? 'bg-sand-100 hover:bg-sand-200 border-sand-250 text-charcoal-700' 
                    : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Options */}
            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => { 
                  logOpponentGoal(2, 'Giro', opponent2pTargetPlayer); 
                  setShowOpponent2pModal(false); 
                  setOpponent2pTargetPlayer(null); 
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-xl transition active:scale-95 text-sm"
              >
                Giro (+2)
              </button>
              <button
                onClick={() => { 
                  logOpponentGoal(2, 'Fly', opponent2pTargetPlayer); 
                  setShowOpponent2pModal(false); 
                  setOpponent2pTargetPlayer(null); 
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-xl transition active:scale-95 text-sm"
              >
                Fly (+2)
              </button>
              <button
                onClick={() => { 
                  logOpponentGoal(2, 'Peto (Especialista)', opponent2pTargetPlayer); 
                  setShowOpponent2pModal(false); 
                  setOpponent2pTargetPlayer(null); 
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-xl transition active:scale-95 text-sm"
              >
                Peto (Especialista) (+2)
              </button>
              <button
                onClick={() => { 
                  logOpponentGoal(2, 'Penalti', opponent2pTargetPlayer); 
                  setShowOpponent2pModal(false); 
                  setOpponent2pTargetPlayer(null); 
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-xl transition active:scale-95 text-sm"
              >
                Penalti (+2)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ACCIONES CONTEXTUALES DEL JUGADOR */}
      {selectedPlayerForActions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 md:p-4 animate-in fade-in duration-200">
          <div className={`p-5 md:p-8 rounded-2xl max-w-lg md:max-w-xl w-full shadow-2xl border-2 transition-all max-h-[90vh] overflow-y-auto ${
            sunMode 
              ? 'bg-[#FCFAF6] border-sand-300 text-zinc-900 shadow-xl' 
              : 'bg-zinc-900 border-zinc-700 text-zinc-50 shadow-2xl'
          }`}>
            {/* HEADER */}
            <div className="flex items-center justify-between border-b pb-4 mb-5 border-sand-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full font-black text-base md:text-lg flex items-center justify-center border border-white/45"
                  style={{ backgroundColor: (selectedPlayerForActions.position === 'Portero' || selectedPlayerForActions.position === 'Especialista' || selectedPlayerForActions.position === 'Polivalente') ? ourGkShirtColor : ourShirtColor }}
                >
                  <span className={(selectedPlayerForActions.position === 'Portero' || selectedPlayerForActions.position === 'Especialista' || selectedPlayerForActions.position === 'Polivalente') ? getShirtStyle(ourGkShirtColor).text : getShirtStyle(ourShirtColor).text}>
                    {selectedPlayerForActions.number}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight">
                    {selectedPlayerForActions.name}
                  </h3>
                  <span className="text-sm md:text-base uppercase font-extrabold text-primary dark:text-[#F59E0B]">
                    {selectedPlayerForActions.position}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlayerForActions(null)}
                className={`p-2 md:p-2.5 rounded-lg border transition ${
                  sunMode 
                    ? 'bg-sand-100 hover:bg-sand-200 border-sand-250 text-charcoal-700' 
                    : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
                }`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-5 md:space-y-6">
              {/* GOALS SECTION */}
              <div>
                <h4 className="text-xs md:text-sm font-black uppercase tracking-wider mb-3 opacity-75">
                  {t.scoreGoal}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {/* GK: Gol Portería (+2p) */}
                  {selectedPlayerForActions.position === 'Portero' && (
                    <button
                      onClick={() => addPoint2(selectedPlayerForActions, 'Portero_Especialista')}
                      className="col-span-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-xl transition active:scale-95 text-center text-base"
                    >
                      Portería (+2)
                    </button>
                  )}

                  {/* Especialista: Gol Especialista (+2p) */}
                  {selectedPlayerForActions.position === 'Especialista' && (
                    <button
                      onClick={() => addPoint2(selectedPlayerForActions, 'Portero_Especialista')}
                      className="col-span-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-xl transition active:scale-95 text-center text-base"
                    >
                      Especialista (+2)
                    </button>
                  )}

                  {/* Polivalente: has simple, fly, giro, penalti goals, but can never be keeper (no Portero_Especialista +2p) */}
                  {selectedPlayerForActions.position === 'Polivalente' && (
                    <>
                      <button
                        onClick={() => addPoint1(selectedPlayerForActions)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl transition active:scale-95 text-base"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => addPoint2(selectedPlayerForActions, 'Fly')}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3.5 rounded-xl transition active:scale-95 text-base"
                      >
                        Fly (+2)
                      </button>
                      <button
                        onClick={() => addPoint2(selectedPlayerForActions, 'Giro')}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3.5 rounded-xl transition active:scale-95 text-base"
                      >
                        Giro (+2)
                      </button>
                      <button
                        onClick={() => addPoint2(selectedPlayerForActions, 'Penalti')}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3.5 rounded-xl transition active:scale-95 text-base"
                      >
                        Penalti (+2)
                      </button>
                    </>
                  )}

                  {/* Standard players: Ala, Ala Izq, Ala Der, Pivote, Defensor */}
                  {selectedPlayerForActions.position !== 'Portero' && selectedPlayerForActions.position !== 'Especialista' && selectedPlayerForActions.position !== 'Polivalente' && (
                    <>
                      <button
                        onClick={() => addPoint1(selectedPlayerForActions)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl transition active:scale-95 text-base"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => addPoint2(selectedPlayerForActions, 'Fly')}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3.5 rounded-xl transition active:scale-95 text-base"
                      >
                        Fly (+2)
                      </button>
                      <button
                        onClick={() => addPoint2(selectedPlayerForActions, 'Giro')}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3.5 rounded-xl transition active:scale-95 text-base"
                      >
                        Giro (+2)
                      </button>
                      <button
                        onClick={() => addPoint2(selectedPlayerForActions, 'Penalti')}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3.5 rounded-xl transition active:scale-95 text-base"
                      >
                        Penalti (+2)
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* ACCIONES DE PORTERÍA (For Portero and Polivalente) */}
              {(selectedPlayerForActions.position === 'Portero' || selectedPlayerForActions.position === 'Polivalente') && (
                <div>
                  <h4 className="text-xs md:text-sm font-black uppercase tracking-wider mb-3 opacity-75">
                    {t.goalkeeping}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        const updatedPlayers = players.map(p => {
                          if (p.id === selectedPlayerForActions.id) {
                            return { ...p, saves: (p.saves || 0) + 1 };
                          }
                          return p;
                        });
                        addLog(`¡ESPECTACULAR PARADA DE PORTERÍA! ${selectedPlayerForActions.name}`, 'save');
                        onUpdateMatchState({
                          ...matchState,
                          players: updatedPlayers
                        });
                        setSelectedPlayerForActions(null);
                      }}
                      className="bg-[#10B981] hover:bg-emerald-600 text-white font-black py-3.5 rounded-xl transition active:scale-95 text-center text-base"
                    >
                      {t.saveAction}
                    </button>
                    <button
                      onClick={() => {
                        logOpponentMiss(selectedPlayerForActions);
                        setSelectedPlayerForActions(null);
                      }}
                      className={`font-black py-3.5 rounded-xl transition active:scale-95 text-center text-base border ${
                        sunMode 
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' 
                          : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/25 text-[#F59E0B]'
                      }`}
                    >
                      {t.rivalMiss}
                    </button>
                    <button
                      onClick={() => {
                        logMissedShot(selectedPlayerForActions);
                        setSelectedPlayerForActions(null);
                      }}
                      className={`col-span-2 font-black py-3.5 rounded-xl transition active:scale-95 text-center text-base border ${
                        sunMode 
                          ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200' 
                          : 'bg-red-950/20 hover:bg-red-900/30 border-red-800/40 text-red-300'
                      }`}
                    >
                      {t.missedShot}
                    </button>
                  </div>
                </div>
              )}

              {/* GOALS CONCEDED SECTION (For Portero and Polivalente) */}
              {(selectedPlayerForActions.position === 'Portero' || selectedPlayerForActions.position === 'Polivalente') && (
                <div>
                  <h4 className="text-xs md:text-sm font-black uppercase tracking-wider mb-3 opacity-75">
                    🥅 Goles Recibidos (Rival)
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        logOpponentGoal(1, undefined, selectedPlayerForActions);
                        setSelectedPlayerForActions(null);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white font-black py-3.5 rounded-xl transition active:scale-95 text-center text-base"
                    >
                      {t.goalConceded1}
                    </button>
                    <button
                      onClick={() => {
                        setOpponent2pTargetPlayer(selectedPlayerForActions);
                        setShowOpponent2pModal(true);
                        setSelectedPlayerForActions(null);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white font-black py-3.5 rounded-xl transition active:scale-95 text-center text-base"
                    >
                      {t.goalConceded2}
                    </button>
                  </div>
                </div>
              )}

              {/* RECOVER & MISS SECTION */}
              {selectedPlayerForActions.position !== 'Portero' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <h4 className="text-xs md:text-sm font-black uppercase tracking-wider mb-3 opacity-75">
                      🟢 Defensa
                    </h4>
                    <button
                      onClick={() => logRecovery(selectedPlayerForActions)}
                      className={`w-full font-black py-3.5 rounded-xl transition active:scale-95 text-center text-sm md:text-base border ${
                        sunMode 
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-[#059669] border-emerald-200' 
                          : 'bg-emerald-950/15 hover:bg-emerald-900/25 border-emerald-900/30 text-emerald-100'
                      }`}
                    >
                      Recuperar
                    </button>
                  </div>

                  <div>
                    <h4 className="text-xs md:text-sm font-black uppercase tracking-wider mb-3 opacity-75">
                      {t.missesSection}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          logMissedShot(selectedPlayerForActions);
                          setSelectedPlayerForActions(null);
                        }}
                        className={`py-3 rounded-xl text-sm font-extrabold text-center active:scale-95 transition border ${
                          sunMode 
                            ? 'bg-sand-100 hover:bg-sand-200 text-charcoal-800 border-sand-300' 
                            : 'bg-charcoal-800 hover:bg-charcoal-750 text-sand-100 border-charcoal-700'
                        }`}
                      >
                        Err +1
                      </button>
                      <button
                        onClick={() => {
                          logMissedFly(selectedPlayerForActions);
                          setSelectedPlayerForActions(null);
                        }}
                        className={`py-3 rounded-xl text-sm font-extrabold text-center active:scale-95 transition border ${
                          sunMode 
                            ? 'bg-amber-gold-bg border-amber-gold/40 text-amber-950 hover:bg-amber-100/50' 
                            : 'bg-charcoal-800 border-amber-gold/25 text-[#F59E0B] hover:bg-amber-gold/15'
                        }`}
                      >
                        Err Fly
                      </button>
                      <button
                        onClick={() => {
                          logMissedSpin(selectedPlayerForActions);
                          setSelectedPlayerForActions(null);
                        }}
                        className={`py-3 rounded-xl text-sm font-extrabold text-center active:scale-95 transition border ${
                          sunMode 
                            ? 'bg-sand-100 hover:bg-sand-200 text-charcoal-800 border-sand-300' 
                            : 'bg-charcoal-800 hover:bg-charcoal-750 text-sand-100 border-charcoal-700'
                        }`}
                      >
                        Err Giro
                      </button>
                      <button
                        onClick={() => {
                          logMissedPenalty(selectedPlayerForActions);
                          setSelectedPlayerForActions(null);
                        }}
                        className={`py-3 rounded-xl text-sm font-extrabold text-center active:scale-95 transition border ${
                          sunMode 
                            ? 'bg-sand-100 hover:bg-sand-200 text-charcoal-800 border-sand-300' 
                            : 'bg-charcoal-800 hover:bg-charcoal-750 text-sand-100 border-charcoal-700'
                        }`}
                      >
                        Err Penalti
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TURNOVER SECTION */}
              <div>
                <h4 className="text-xs md:text-sm font-black uppercase tracking-wider mb-3 opacity-75">
                  ⚠️ Pérdida de Balón
                </h4>
                <div className={`grid gap-2 md:gap-3 ${selectedPlayerForActions.position === 'Portero' ? 'grid-cols-1' : 'grid-cols-3'}`}>
                  <button
                    onClick={() => logTurnover(selectedPlayerForActions, 'bad_pass')}
                    className={`py-3 md:py-3.5 rounded-xl text-sm md:text-base font-extrabold text-center active:scale-95 transition border ${
                      sunMode 
                        ? 'bg-red-50 hover:bg-red-100 text-[#DC2626] border-red-200' 
                        : 'bg-red-950/10 hover:bg-red-900/20 border-red-900/30 text-red-100'
                    }`}
                  >
                    Mal Pase
                  </button>
                  {selectedPlayerForActions.position !== 'Portero' && (
                    <>
                      <button
                        onClick={() => logTurnover(selectedPlayerForActions, 'steps')}
                        className={`py-3 md:py-3.5 rounded-xl text-sm md:text-base font-extrabold text-center active:scale-95 transition border ${
                          sunMode 
                            ? 'bg-red-50 hover:bg-red-100 text-[#DC2626] border-red-200' 
                            : 'bg-red-950/10 hover:bg-red-900/20 border-red-900/30 text-red-100'
                        }`}
                      >
                        Pasos
                      </button>
                      <button
                        onClick={() => logTurnover(selectedPlayerForActions, 'fumbling')}
                        className={`py-3 md:py-3.5 rounded-xl text-sm md:text-base font-extrabold text-center active:scale-95 transition border ${
                          sunMode 
                            ? 'bg-red-50 hover:bg-red-100 text-[#DC2626] border-red-200' 
                            : 'bg-red-950/10 hover:bg-red-900/20 border-red-900/30 text-red-100'
                        }`}
                      >
                        Fumble
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* SANCTIONS SECTION */}
              <div>
                <h4 className="text-xs md:text-sm font-black uppercase tracking-wider mb-3 opacity-75">
                  🟥 Disciplina y Sanciones
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => triggerExclusion(selectedPlayerForActions)}
                    className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-black py-3.5 rounded-xl transition active:scale-95 text-sm md:text-base text-center shadow-3xs"
                  >
                    Exclusión
                  </button>
                  <button
                    onClick={() => triggerDirectRedCard(selectedPlayerForActions)}
                    className="bg-red-600 hover:bg-red-700 text-white font-black py-3.5 rounded-xl transition active:scale-95 text-sm md:text-base text-center shadow-3xs"
                  >
                    Tarjeta Roja
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TIME EDIT MODAL */}
      {showTimeEditModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-[9999] animate-in fade-in duration-200">
          <div className={`p-6 rounded-2xl max-w-xs w-full mx-4 shadow-2xl border-2 ${
            sunMode 
              ? 'bg-[#FCFAF6] border-sand-300 text-zinc-900 shadow-xl' 
              : 'bg-zinc-900 border-zinc-700 text-zinc-50 shadow-2xl'
          }`}>
            <h3 className="text-lg font-black uppercase tracking-wider mb-4">
              ⏱️ {t.editTime}
            </h3>

            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="text-center">
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">{t.min}</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
                  className={`w-20 text-center text-3xl font-mono font-extrabold border rounded-lg py-2 outline-none focus:ring-2 focus:ring-amber-500 transition-all ${
                    sunMode 
                      ? 'bg-white border-sand-300 text-zinc-900' 
                      : 'bg-zinc-950 border-zinc-700 text-zinc-50'
                  }`}
                />
              </div>
              <span className="text-3xl font-mono font-extrabold mt-4">:</span>
              <div className="text-center">
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">{t.sec}</label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={editSeconds}
                  onChange={(e) => setEditSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className={`w-20 text-center text-3xl font-mono font-extrabold border rounded-lg py-2 outline-none focus:ring-2 focus:ring-amber-500 transition-all ${
                    sunMode 
                      ? 'bg-white border-sand-300 text-zinc-900' 
                      : 'bg-zinc-950 border-zinc-700 text-zinc-50'
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowTimeEditModal(false)}
                className={`py-2 px-4 rounded-xl text-xs font-black uppercase transition active:scale-95 ${
                  sunMode ? 'bg-sand-200 text-zinc-800 hover:bg-sand-300' : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveTimeEdit}
                className="py-2 px-4 bg-amber-500 hover:bg-amber-600 text-gray-900 rounded-xl text-xs font-black uppercase transition active:scale-95 shadow-sm"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TIMER RESET CONFIRMATION MODAL */}
      {timerResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] animate-in fade-in duration-200">
          <div className={`p-6 rounded-2xl max-w-sm w-full mx-4 shadow-2xl border-2 ${
            sunMode 
              ? 'bg-[#FCFAF6] border-sand-300 text-zinc-900 shadow-xl' 
              : 'bg-zinc-900 border-zinc-700 text-zinc-50 shadow-2xl'
          }`}>
            <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-amber-500">
              <RotateCcw className="w-7 h-7" />
              <h3 className="text-lg font-black uppercase tracking-wide">¿Reiniciar Reloj?</h3>
            </div>
            
            <p className="text-sm font-medium mb-5 opacity-95 leading-relaxed">
              El tiempo se restablecerá a <strong>10:00</strong> y el reloj se pausará.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setTimerResetConfirm(false)}
                className={`py-2.5 px-4 rounded-xl font-bold text-xs uppercase cursor-pointer hover:opacity-85 transition active:scale-95 duration-100 ${
                  sunMode ? 'bg-sand-200 text-zinc-800' : 'bg-zinc-800 text-zinc-100'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimerResetConfirm(false);
                  setTimeRemaining(600);
                  setIsTimerRunning(false);
                  addLog('Tiempo de set restablecido a 10:00.', 'system');
                }}
                className="py-2.5 px-5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs uppercase cursor-pointer tracking-wider shadow-sm transition active:scale-95 duration-100"
              >
                Sí, reiniciar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: EXCLUSIÓN RIVAL */}
      {showRivalExclusionModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-[9999] animate-in fade-in duration-200">
          <div className={`p-6 rounded-2xl max-w-sm w-full mx-4 shadow-2xl border-2 ${
            sunMode 
              ? 'bg-[#FCFAF6] border-sand-300 text-zinc-900 shadow-xl' 
              : 'bg-zinc-900 border-zinc-700 text-zinc-50 shadow-2xl'
          }`}>
            <div className="flex items-center gap-3 mb-4 text-warning">
              <AlertTriangle className="w-7 h-7 text-amber-500 animate-pulse" />
              <h3 className="text-lg font-black uppercase tracking-wide">
                Exclusión Rival
              </h3>
            </div>
            
            <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-75">
              Introduce el dorsal del jugador excluido del {opponentName}:
            </p>

            <input
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              placeholder="Ej. 14"
              value={rivalExclusionDorsal}
              onChange={(e) => setRivalExclusionDorsal(e.target.value.replace(/\D/g, ''))}
              className={`w-full text-center text-xl font-extrabold border rounded-lg py-2.5 outline-none focus:ring-2 focus:ring-amber-500 transition-all mb-5 ${
                sunMode 
                  ? 'bg-white border-sand-300 text-zinc-900' 
                  : 'bg-zinc-950 border-zinc-700 text-zinc-50'
              }`}
              autoFocus
            />

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowRivalExclusionModal(false);
                  setRivalExclusionDorsal('');
                }}
                className={`py-2 px-4 rounded-xl font-bold text-xs uppercase cursor-pointer hover:opacity-85 transition active:scale-95 duration-100 ${
                  sunMode ? 'bg-sand-200 text-zinc-800' : 'bg-zinc-800 text-zinc-100'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!rivalExclusionDorsal.trim()}
                onClick={addRivalExclusion}
                className="py-2 px-5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 rounded-xl font-black text-xs uppercase cursor-pointer tracking-wider shadow-sm transition active:scale-95 duration-100"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK POPUP: CONFIGURAR EQUIPO Y COLOR */}
      {teamConfigModalType && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-[9999] animate-in fade-in duration-200">
          <div className={`p-6 rounded-2xl max-w-sm w-full mx-4 shadow-2xl border-2 ${
            sunMode 
              ? 'bg-[#FCFAF6] border-sand-300 text-zinc-900 shadow-xl' 
              : 'bg-zinc-900 border-zinc-700 text-zinc-50 shadow-2xl'
          }`}>
            <h3 className="text-lg font-black uppercase tracking-wider mb-4">
              Configurar {teamConfigModalType === 'us' ? 'Nuestro Equipo' : 'Equipo Rival'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                  Nombre del Equipo
                </label>
                <input
                  type="text"
                  value={tempTeamName}
                  onChange={(e) => setTempTeamName(e.target.value)}
                  className={`w-full text-sm font-extrabold border rounded-lg py-2 px-3 outline-none focus:ring-2 focus:ring-amber-500 transition-all ${
                    sunMode 
                      ? 'bg-white border-sand-300 text-zinc-900' 
                      : 'bg-zinc-950 border-zinc-700 text-zinc-50'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2">
                  Color de Camiseta
                </label>
                <div className="flex flex-wrap gap-2">
                  {SHIRT_COLORS.map((color) => (
                    <button
                      key={`modal-${color.hex}`}
                      type="button"
                      onClick={() => setTempShirtColor(color.hex)}
                      className={`w-9 h-9 rounded-full border-4 shadow-sm transition-all duration-150 relative active:scale-95 ${
                        tempShirtColor === color.hex ? 'scale-105 border-amber-500 ring-2 ring-amber-500/40' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {tempShirtColor === color.hex && (
                        <span className="absolute inset-0 flex items-center justify-center font-bold text-xs" style={{ color: color.hex === '#ffffff' ? '#000000' : '#ffffff' }}>
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setTeamConfigModalType(null)}
                className={`py-2 px-4 rounded-xl text-xs font-black uppercase transition active:scale-95 ${
                  sunMode ? 'bg-sand-200 text-zinc-800 hover:bg-sand-300' : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveTeamConfig}
                className="py-2 px-4 bg-amber-500 hover:bg-amber-600 text-gray-900 rounded-xl text-xs font-black uppercase transition active:scale-95 shadow-sm"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIST MODAL */}
      {showAssistModal && pendingGoalScorer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className={`p-5 md:p-6 rounded-2xl max-w-md w-full shadow-2xl border-2 ${
            sunMode ? 'bg-white border-emerald-200' : 'bg-zinc-900 border-emerald-700'
          }`}>
            <h3 className={`text-lg font-black uppercase mb-3 ${sunMode ? 'text-gray-900' : 'text-white'}`}>
              🤝 ¿Quién asistió?
            </h3>
            <p className={`text-xs mb-4 ${sunMode ? 'text-gray-500' : 'text-zinc-400'}`}>
              Gol de {pendingGoalScorer.name}
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto mb-3">
              {players.filter(p => p.id !== pendingGoalScorer.id && !p.isDisqualified).map(p => (
                <button
                  key={`assist-${p.id}`}
                  onClick={() => registerAssist(p)}
                  className={`p-3 rounded-xl text-sm font-bold text-left transition active:scale-95 border ${
                    sunMode ? 'border-gray-200 hover:bg-emerald-50 text-gray-900' : 'border-zinc-700 hover:bg-zinc-800 text-white'
                  }`}
                >
                  #{p.number} {p.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => registerAssist(null)}
              className={`w-full py-3 rounded-xl font-bold text-sm transition active:scale-95 border ${
                sunMode ? 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200' : 'border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              Sin asistencia
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

