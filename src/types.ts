/**
 * Types and interfaces for BeachHandball Stats 2026
 * According to IHF 2026 official regulations.
 */

export type PlayerPosition = 'Ala Izq.' | 'Ala Der.' | 'Ala' | 'Pivote' | 'Especialista' | 'Portero' | 'Defensor' | 'Polivalente';

export interface Player {
  id: string;
  name: string;
  number: number;
  position: PlayerPosition;
  isActiveOnCourt: boolean; // Exactly 4 active on court
  exclusions: number; // 0, 1, 2 (2 is direct red card / disqualification)
  isDisqualified: boolean; // second exclusion or direct red card
  isSuspended?: boolean; // currently serving "Una Posesión" suspension
  predefinedAttack?: boolean; // Predefined attack lineup player
  predefinedDefense?: boolean; // Predefined defense lineup player
  
  // Scoring statistics
  goals1p: number;
  goals2p: number;
  missedShots: number;
  missedFlies: number; // specifically tracking failed alley-oops / flies
  
  // Turnovers breakdown
  turnoverBadPass: number;
  turnoverSteps: number;
  turnoverFumbling: number;
  
  // Defensive statistics
  recoveries: number;
  saves?: number;
  goalsConceded?: number;
}

export type Possession = 'us' | 'them';

export interface TeamConfig {
  name: string;
  shirtColor: string; // Hex color or styling class
  gkShirtColor: string; // Specialized distinct color
  score: number;
}

export interface SetState {
  setNumber: 1 | 2;
  usScore: number;
  themScore: number;
  usTTOUsed: boolean; // Max 1 per set (60 seconds)
  themTTOUsed: boolean;
  ttoActive: boolean;
  ttoSecondsLeft: number;
  isGoldenGoal: boolean;
  isFinished: boolean;
  winner: 'us' | 'them' | null;
}

export interface ShootoutRound {
  usGoal: boolean | null; // null = not taken, true = goal (2pts), false = miss
  themGoal: boolean | null;
  usPlayerId?: string;
  type?: 'Portero' | 'Especialista' | 'Fly' | 'Giro' | 'Penalti' | 'Regular';
  usPoints?: number;
  themPoints?: number;
}

export interface MatchState {
  currentPeriod: 'set1' | 'set2' | 'shootout';
  set1: SetState;
  set2: SetState;
  shootoutRounds: ShootoutRound[];
  activePossession: Possession;
  passivePasses: number | null; // null means warning not raised, 0 to 4 passes
  players: Player[];
  opponentName: string;
  ourTeamName?: string;
  rulesAlertActive: boolean; // 15 seconds rule indicator
  historyEvents?: EventLog[];
}

export interface EventLog {
  id: string;
  timestamp: string; // format mm:ss
  period: 'set1' | 'set2' | 'shootout';
  description: string;
  type: 'goal_us' | 'goal_them' | 'miss_us' | 'miss_them' | 'exclusion' | 'turnover' | 'save' | 'tto' | 'system';
}
