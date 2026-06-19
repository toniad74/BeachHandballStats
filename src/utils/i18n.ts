export type Language = 'es' | 'ca' | 'en';

export interface Translations {
  // App header
  appName: string;
  // Nav tabs
  tabMatch: string;
  tabShootout: string;
  tabAnalysis: string;
  tabTeam: string;
  tabArchive: string;
  // Header controls
  nightMode: string;
  sunMode: string;
  reset: string;
  install: string;
  logout: string;
  // Match summary
  set1: string;
  set2: string;
  inProgress: string;
  finished: string;
  pending: string;
  shootout: string;
  // GameBoard
  convocados: string;
  selectPlayer: string;
  undo: string;
  excluded: string;
  sanctions: string;
  noneFullStrength: string;
  rivalExclusion: string;
  sanctioned: string;
  redCard: string;
  exclusion: string;
  // Player actions modal
  scoreGoal: string;
  goalkeepingActions: string;
  save: string;
  rivalMiss: string;
  goalsConceded: string;
  goalConceded: string;
  defense: string;
  recover: string;
  misses: string;
  error: string;
  errFly: string;
  turnover: string;
  badPass: string;
  steps: string;
  fumble: string;
  discipline: string;
  exclusionBtn: string;
  directRedCard: string;
  // Shootout
  shootoutTitle: string;
  suddenDeath: string;
  clearRound: string;
  confirm: string;
  cancel: string;
  selectShooter: string;
  chooseShooter: string;
  alreadyShot: string;
  // Analytics
  coachStats: string;
  realTimeMetrics: string;
  points: string;
  effectiveness: string;
  turnovers: string;
  shotEffectiveness: string;
  flyEffectiveness: string;
  goalkeeperEffectiveness: string;
  accurate: string;
  turnoversBreakdown: string;
  badPasses: string;
  walking: string;
  fumblingBall: string;
  tacticalRisk: string;
  flyAccuracy: string;
  pointsRatio: string;
  pointsViaDoubles: string;
  individualPerformance: string;
  goals1pt: string;
  goals2pt: string;
  saves: string;
  conceded: string;
  savePercent: string;
  missesLabel: string;
  recoveries: string;
  losses: string;
  // Team setup
  playerRoster: string;
  maxPlayers: string;
  addPlayer: string;
  player: string;
  position: string;
  actions: string;
  // Archive
  saveCurrentMatch: string;
  saveToCloud: string;
  matchNameOptional: string;
  saving: string;
  savedMatches: string;
  matchesInCloud: string;
  load: string;
  delete: string;
  noSavedMatches: string;
  saveFirstMatch: string;
  // Reset modal
  resetMatch: string;
  resetConfirmText: string;
  preserved: string;
  yesReset: string;
  // Positions
  posGoalkeeper: string;
  posSpecialist: string;
  posVersatile: string;
  posLeftWing: string;
  posRightWing: string;
  posWing: string;
  posPivot: string;
  posDefender: string;
  // Footer
  copyright: string;
}

const es: Translations = {
  appName: 'BeachHandball Stats',
  tabMatch: 'Partido',
  tabShootout: 'Shootout',
  tabAnalysis: 'Análisis',
  tabTeam: 'Equipo',
  tabArchive: 'Archivo',
  nightMode: 'Noche',
  sunMode: 'Sol',
  reset: 'Reset',
  install: 'Instalar',
  logout: 'Salir',
  set1: 'SET 1',
  set2: 'SET 2',
  inProgress: 'En Curso',
  finished: 'Finalizado',
  pending: 'Pendiente',
  shootout: 'SHOOTOUT',
  convocados: 'CONVOCADOS',
  selectPlayer: 'Selecciona un jugador para registrar acciones',
  undo: 'Deshacer',
  excluded: 'Jugadores Excluidos / Sanciones',
  sanctions: 'Sanciones',
  noneFullStrength: 'Ninguno (Fuerza completa en pista)',
  rivalExclusion: '+ Exclusión Rival',
  sanctioned: 'Sancionando',
  redCard: 'Tarjeta Roja',
  exclusion: 'Exclusión',
  scoreGoal: 'Anotar Gol',
  goalkeepingActions: 'Acciones de Portería',
  save: 'Parada',
  rivalMiss: 'Fallo Rival',
  goalsConceded: 'Goles Recibidos (Rival)',
  goalConceded: 'Gol Recibido',
  defense: 'Defensa',
  recover: 'Recuperar',
  misses: 'Fallos',
  error: 'Error',
  errFly: 'Err Fly',
  turnover: 'Pérdida de Balón',
  badPass: 'Mal Pase',
  steps: 'Pasos',
  fumble: 'Fumble',
  discipline: 'Disciplina y Sanciones',
  exclusionBtn: 'Exclusión',
  directRedCard: 'Tarjeta Roja',
  shootoutTitle: 'Desempate Shootout (Uno contra el Portero)',
  suddenDeath: '+ Muerte Súbita',
  clearRound: 'Limpiar Tanda',
  confirm: 'Confirmar',
  cancel: 'Cancelar',
  selectShooter: 'Seleccionar Lanzador',
  chooseShooter: 'Elige qué jugador va a lanzar a continuación:',
  alreadyShot: 'Lanzó',
  coachStats: 'Estadísticas del Entrenador',
  realTimeMetrics: 'Métricas en tiempo real',
  points: 'Puntos',
  effectiveness: 'Efect.',
  turnovers: 'Pérdidas',
  shotEffectiveness: 'Efectividad de Tiro',
  flyEffectiveness: 'Efectividad de Fly',
  goalkeeperEffectiveness: 'Efectividad Portería',
  accurate: 'Acertados',
  turnoversBreakdown: 'Desglose de Pérdidas de Balón',
  badPasses: 'Pases Fallados',
  walking: 'Pasos (Walking)',
  fumblingBall: 'Fumbling / Pérdida del bote',
  tacticalRisk: 'Efectividad Táctica de Riesgo',
  flyAccuracy: 'Acierto del Fly',
  pointsRatio: 'Ratio de Puntos',
  pointsViaDoubles: 'Puntos vía Dobles',
  individualPerformance: 'Rendimiento Individual',
  goals1pt: 'Gol 1pt',
  goals2pt: 'Gol 2pt',
  saves: 'Paradas',
  conceded: 'Encajados',
  savePercent: '% Par.',
  missesLabel: 'Fallos',
  recoveries: 'Recup.',
  losses: 'Pérdidas',
  playerRoster: 'Acta de Jugadores',
  maxPlayers: 'Plantilla ampliada: Máx. 16 jugadores en acta.',
  addPlayer: 'Sumar Jugador',
  player: 'Jugador',
  position: 'Posición Táctica',
  actions: 'Acciones',
  saveCurrentMatch: 'Guardar Partido Actual',
  saveToCloud: 'Guarda el estado actual del partido en la nube',
  matchNameOptional: 'Nombre del partido (opcional)',
  saving: 'Guardando...',
  savedMatches: 'Partidos Guardados',
  matchesInCloud: 'partidos en la nube',
  load: 'Cargar',
  delete: 'Eliminar',
  noSavedMatches: 'No hay partidos guardados',
  saveFirstMatch: 'Guarda tu primer partido usando el botón de arriba',
  resetMatch: '¿Restablecer Partido?',
  resetConfirmText: '¿Estás seguro de que quieres limpiar todos los goles, exclusiones, pérdidas de balón y puntuaciones del partido actual?',
  preserved: 'Se conservará: El nombre de tu oponente y las configuraciones de tu plantilla.',
  yesReset: 'Sí, restablecer',
  posGoalkeeper: 'Portero',
  posSpecialist: 'Especialista',
  posVersatile: 'Polivalente',
  posLeftWing: 'Ala Izq.',
  posRightWing: 'Ala Der.',
  posWing: 'Ala',
  posPivot: 'Pivote',
  posDefender: 'Defensor',
  copyright: '© 2026 IAtpro74',
};

const ca: Translations = {
  appName: 'BeachHandball Stats',
  tabMatch: 'Partit',
  tabShootout: 'Shootout',
  tabAnalysis: 'Anàlisi',
  tabTeam: 'Equip',
  tabArchive: 'Arxiu',
  nightMode: 'Nit',
  sunMode: 'Sol',
  reset: 'Reset',
  install: 'Instal·lar',
  logout: 'Sortir',
  set1: 'SET 1',
  set2: 'SET 2',
  inProgress: 'En Curs',
  finished: 'Finalitzat',
  pending: 'Pendent',
  shootout: 'SHOOTOUT',
  convocados: 'CONVOCATS',
  selectPlayer: 'Selecciona un jugador per registrar accions',
  undo: 'Desfer',
  excluded: 'Jugadors Exclosos / Sancions',
  sanctions: 'Sancions',
  noneFullStrength: 'Cap (Força completa a pista)',
  rivalExclusion: '+ Exclusió Rival',
  sanctioned: 'Sancionant',
  redCard: 'Targeta Vermella',
  exclusion: 'Exclusió',
  scoreGoal: 'Anotar Gol',
  goalkeepingActions: 'Accions de Porteria',
  save: 'Aturada',
  rivalMiss: 'Error Rival',
  goalsConceded: 'Gols Rebuts (Rival)',
  goalConceded: 'Gol Rebut',
  defense: 'Defensa',
  recover: 'Recuperar',
  misses: 'Errors',
  error: 'Error',
  errFly: 'Err Fly',
  turnover: 'Pèrdua de Pilota',
  badPass: 'Mala Passada',
  steps: 'Passos',
  fumble: 'Fumble',
  discipline: 'Disciplina i Sancions',
  exclusionBtn: 'Exclusió',
  directRedCard: 'Targeta Vermella',
  shootoutTitle: 'Desempat Shootout (Un contra el Porter)',
  suddenDeath: '+ Mort Sobtada',
  clearRound: 'Netejar Tanda',
  confirm: 'Confirmar',
  cancel: 'Cancel·lar',
  selectShooter: 'Seleccionar Llançador',
  chooseShooter: 'Tria quin jugador llançarà a continuació:',
  alreadyShot: 'Llançat',
  coachStats: "Estadístiques de l'Entrenador",
  realTimeMetrics: 'Mètriques en temps real',
  points: 'Punts',
  effectiveness: 'Efect.',
  turnovers: 'Pèrdues',
  shotEffectiveness: 'Efectivitat de Tir',
  flyEffectiveness: 'Efectivitat de Fly',
  goalkeeperEffectiveness: 'Efectivitat Porteria',
  accurate: 'Encertats',
  turnoversBreakdown: 'Desglossament de Pèrdues de Pilota',
  badPasses: 'Passades Fallades',
  walking: 'Passos (Walking)',
  fumblingBall: 'Fumbling / Pèrdua del bot',
  tacticalRisk: 'Efectivitat Tàctica de Risc',
  flyAccuracy: 'Encert del Fly',
  pointsRatio: 'Ràtio de Punts',
  pointsViaDoubles: 'Punts via Dobles',
  individualPerformance: 'Rendiment Individual',
  goals1pt: 'Gol 1pt',
  goals2pt: 'Gol 2pt',
  saves: 'Aturades',
  conceded: 'Encaixats',
  savePercent: '% At.',
  missesLabel: 'Errors',
  recoveries: 'Recup.',
  losses: 'Pèrdues',
  playerRoster: 'Acta de Jugadors',
  maxPlayers: 'Plantilla ampliada: Màx. 16 jugadors en acta.',
  addPlayer: 'Afegir Jugador',
  player: 'Jugador',
  position: 'Posició Tàctica',
  actions: 'Accions',
  saveCurrentMatch: 'Guardar Partit Actual',
  saveToCloud: "Guarda l'estat actual del partit al núvol",
  matchNameOptional: 'Nom del partit (opcional)',
  saving: 'Guardant...',
  savedMatches: 'Partits Guardats',
  matchesInCloud: 'partits al núvol',
  load: 'Carregar',
  delete: 'Eliminar',
  noSavedMatches: 'No hi ha partits guardats',
  saveFirstMatch: "Guarda el teu primer partit amb el botó de dalt",
  resetMatch: 'Restablir Partit?',
  resetConfirmText: "Estàs segur que vols netejar tots els gols, exclusions, pèrdues de pilota i puntuacions del partit actual?",
  preserved: "Es conservarà: El nom de l'oponent i les configuracions de la plantilla.",
  yesReset: 'Sí, restablir',
  posGoalkeeper: 'Porter',
  posSpecialist: 'Especialista',
  posVersatile: 'Polivalent',
  posLeftWing: 'Ala Esq.',
  posRightWing: 'Ala Dreta',
  posWing: 'Ala',
  posPivot: 'Pivot',
  posDefender: 'Defensor',
  copyright: '© 2026 IAtpro74',
};

const en: Translations = {
  appName: 'BeachHandball Stats',
  tabMatch: 'Match',
  tabShootout: 'Shootout',
  tabAnalysis: 'Stats',
  tabTeam: 'Team',
  tabArchive: 'Archive',
  nightMode: 'Night',
  sunMode: 'Sun',
  reset: 'Reset',
  install: 'Install',
  logout: 'Logout',
  set1: 'SET 1',
  set2: 'SET 2',
  inProgress: 'Live',
  finished: 'Finished',
  pending: 'Pending',
  shootout: 'SHOOTOUT',
  convocados: 'SQUAD',
  selectPlayer: 'Select a player to register actions',
  undo: 'Undo',
  excluded: 'Excluded Players / Sanctions',
  sanctions: 'Sanctions',
  noneFullStrength: 'None (Full strength on court)',
  rivalExclusion: '+ Rival Exclusion',
  sanctioned: 'Suspended',
  redCard: 'Red Card',
  exclusion: 'Exclusion',
  scoreGoal: 'Score Goal',
  goalkeepingActions: 'Goalkeeper Actions',
  save: 'Save',
  rivalMiss: 'Rival Miss',
  goalsConceded: 'Goals Conceded (Rival)',
  goalConceded: 'Goal Conceded',
  defense: 'Defense',
  recover: 'Recover',
  misses: 'Misses',
  error: 'Miss',
  errFly: 'Fly Miss',
  turnover: 'Turnover',
  badPass: 'Bad Pass',
  steps: 'Steps',
  fumble: 'Fumble',
  discipline: 'Discipline & Sanctions',
  exclusionBtn: 'Exclusion',
  directRedCard: 'Red Card',
  shootoutTitle: 'Shootout Tiebreak (1v1 vs Goalkeeper)',
  suddenDeath: '+ Sudden Death',
  clearRound: 'Clear Round',
  confirm: 'Confirm',
  cancel: 'Cancel',
  selectShooter: 'Select Shooter',
  chooseShooter: 'Choose which player will shoot next:',
  alreadyShot: 'Shot',
  coachStats: 'Coach Statistics',
  realTimeMetrics: 'Real-time metrics',
  points: 'Points',
  effectiveness: 'Eff.',
  turnovers: 'Turnovers',
  shotEffectiveness: 'Shot Effectiveness',
  flyEffectiveness: 'Fly Effectiveness',
  goalkeeperEffectiveness: 'Goalkeeper Effectiveness',
  accurate: 'Accurate',
  turnoversBreakdown: 'Turnovers Breakdown',
  badPasses: 'Bad Passes',
  walking: 'Steps (Walking)',
  fumblingBall: 'Fumbling / Lost Dribble',
  tacticalRisk: 'Tactical Risk Effectiveness',
  flyAccuracy: 'Fly Accuracy',
  pointsRatio: 'Points Ratio',
  pointsViaDoubles: 'Points via Doubles',
  individualPerformance: 'Individual Performance',
  goals1pt: '1pt Goal',
  goals2pt: '2pt Goal',
  saves: 'Saves',
  conceded: 'Conceded',
  savePercent: 'Save %',
  missesLabel: 'Misses',
  recoveries: 'Recov.',
  losses: 'Losses',
  playerRoster: 'Player Roster',
  maxPlayers: 'Extended squad: Max. 16 players on the roster.',
  addPlayer: 'Add Player',
  player: 'Player',
  position: 'Tactical Position',
  actions: 'Actions',
  saveCurrentMatch: 'Save Current Match',
  saveToCloud: 'Save the current match state to the cloud',
  matchNameOptional: 'Match name (optional)',
  saving: 'Saving...',
  savedMatches: 'Saved Matches',
  matchesInCloud: 'matches in the cloud',
  load: 'Load',
  delete: 'Delete',
  noSavedMatches: 'No saved matches',
  saveFirstMatch: 'Save your first match using the button above',
  resetMatch: 'Reset Match?',
  resetConfirmText: 'Are you sure you want to clear all goals, exclusions, turnovers and scores from the current match?',
  preserved: 'Preserved: Opponent name and your squad configuration.',
  yesReset: 'Yes, reset',
  posGoalkeeper: 'Goalkeeper',
  posSpecialist: 'Specialist',
  posVersatile: 'Versatile',
  posLeftWing: 'Left Wing',
  posRightWing: 'Right Wing',
  posWing: 'Wing',
  posPivot: 'Pivot',
  posDefender: 'Defender',
  copyright: '© 2026 IAtpro74',
};

export const translations: Record<Language, Translations> = { es, ca, en };

export function getTranslations(lang: Language): Translations {
  return translations[lang];
}

export const LANGUAGE_OPTIONS: { value: Language; label: string; flag: string }[] = [
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'ca', label: 'Català', flag: '🏳️' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
];
