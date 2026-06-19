import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'es' | 'ca' | 'en';

interface Translations {
  [key: string]: string;
}

const translations: Record<Language, Translations> = {
  es: {
    // Header
    'app.title': 'BeachHandball Stats',
    // Tabs
    'tab.match': 'Partido',
    'tab.shootout': 'Shootout',
    'tab.analysis': 'Análisis',
    'tab.team': 'Equipo',
    'tab.archive': 'Archivo',
    // Header controls
    'btn.night': 'Noche',
    'btn.sun': 'Sol',
    'btn.reset': 'Reset',
    'btn.install': 'Instalar',
    'btn.logout': 'Cerrar sesión',
    // Match results
    'match.set1': 'SET 1',
    'match.set2': 'SET 2',
    'match.finished': 'Finalizado',
    'match.inProgress': 'En Curso',
    'match.pending': 'Pendiente',
    'match.shootout': 'SHOOTOUT',
    // GameBoard
    'game.convocados': 'CONVOCADOS',
    'game.convocados.desc': 'Selecciona cualquier jugador para abrir el menú de acciones.',
    'game.undo': 'Deshacer',
    'game.excluded': 'Jugadores Excluidos / Sanciones',
    'game.noExcluded': 'Ninguno (Fuerza completa en pista)',
    'game.suspended': 'Sancionando',
    'game.rivalExclusion': '+ Exclusión Rival',
    'game.goldenGoal': 'Gol de Oro',
    'game.passiveWarning': '¡ADVERTENCIA DE JUEGO PASIVO!',
    'game.last15': 'ÚLTIMOS 15 SEGUNDOS: CUALQUIER FALTA GRAVE CONLLEVA DESCALIFICACIÓN DIRECTA + PENALTI 6M',
    // Player actions modal
    'action.goal': 'Anotar Gol',
    'action.goalkeeper': 'Acciones de Portería',
    'action.save': 'Parada',
    'action.rivalMiss': 'Fallo Rival',
    'action.goalsConceded': 'Goles Recibidos (Rival)',
    'action.goalConceded1': 'Gol Recibido +1',
    'action.goalConceded2': 'Gol Recibido +2',
    'action.defense': 'Defensa',
    'action.recover': 'Recuperar',
    'action.misses': 'Fallos',
    'action.missShot': 'Error',
    'action.missFly': 'Err Fly',
    'action.turnover': 'Pérdida de Balón',
    'action.badPass': 'Mal Pase',
    'action.steps': 'Pasos',
    'action.fumble': 'Fumble',
    'action.discipline': 'Disciplina y Sanciones',
    'action.exclusion': 'Exclusión',
    'action.redCard': 'Tarjeta Roja',
    // Shootout
    'shootout.title': 'Desempate Shootout (Uno contra el Portero)',
    'shootout.suddenDeath': '+ Muerte Súbita',
    'shootout.clearRound': 'Limpiar Tanda',
    'shootout.confirm': '⚠️ ¿Confirmar?',
    'shootout.selectPlayer': 'Elige qué jugador va a lanzar:',
    'shootout.shot': 'Lanzó',
    'shootout.toShoot': 'Por lanzar',
    'shootout.vsGoal': 'Contra portería',
    'shootout.miss': 'FALLO / PARADA',
    'shootout.rivalMiss': 'PARADA / FUERA',
    // Analytics
    'analytics.title': 'Estadísticas del Entrenador',
    'analytics.realtime': 'Métricas en tiempo real',
    'analytics.points': 'Puntos',
    'analytics.effectiveness': 'Efect.',
    'analytics.turnovers': 'Pérdidas',
    'analytics.shotEff': 'Efectividad de Tiro',
    'analytics.flyEff': 'Efectividad de Fly',
    'analytics.gkEff': 'Efectividad Portería',
    'analytics.hits': 'Acertados',
    'analytics.stopped': 'Parados',
    'analytics.turnoverBreakdown': 'Desglose de Pérdidas de Balón',
    'analytics.badPasses': 'Pases Fallados',
    'analytics.stepsWalking': 'Pasos (Walking)',
    'analytics.fumbling': 'Fumbling / Pérdida del bote',
    'analytics.riskStrategy': 'Efectividad Táctica de Riesgo',
    'analytics.flySuccess': 'Acierto del Fly',
    'analytics.pointsRatio': 'Ratio de Puntos',
    'analytics.flyInFlight': 'Éxito en In-Flight',
    'analytics.doublePoints': 'Puntos vía Dobles',
    'analytics.individual': 'Rendimiento Individual',
    'analytics.goals1pt': 'Gol 1pt',
    'analytics.goals2pt': 'Gol 2pt',
    'analytics.saves': 'Paradas',
    'analytics.conceded': 'Encajados',
    'analytics.savePercent': '% Par.',
    'analytics.missed': 'Fallos',
    'analytics.errFly': 'Err Fly',
    'analytics.losses': 'Pérdidas',
    'analytics.recoveries': 'Recup.',
    'analytics.points_label': 'Puntos',
    'analytics.saves_label': 'Paradas',
    // Team / SetupTeam
    'team.roster': 'Acta de Jugadores',
    'team.maxPlayers': 'Plantilla ampliada: Máx. 16 jugadores en acta.',
    'team.addPlayer': 'Sumar Jugador',
    'team.dorsal': 'Dorsal',
    'team.player': 'Jugador',
    'team.position': 'Posición Táctica',
    'team.actions': 'Acciones',
    // Archive / MatchHistory
    'archive.save': 'Guardar Partido Actual',
    'archive.saveDesc': 'Guarda el estado actual del partido en la nube',
    'archive.saveName': 'Nombre del partido (opcional)',
    'archive.saveBtn': 'Guardar',
    'archive.saving': 'Guardando...',
    'archive.saved': 'Partidos Guardados',
    'archive.matchCount': 'partido(s) en la nube',
    'archive.load': 'Cargar',
    'archive.delete': 'Eliminar partido',
    'archive.confirmDelete': 'Confirmar',
    'archive.cancel': 'Cancelar',
    'archive.noMatches': 'No hay partidos guardados',
    'archive.noMatchesDesc': 'Guarda tu primer partido usando el botón de arriba',
    'archive.loading': 'Cargando partidos...',
    // Reset modal
    'reset.title': '¿Restablecer Partido?',
    'reset.desc': '¿Estás seguro de que quieres limpiar todos los goles, exclusiones, pérdidas de balón y puntuaciones del partido actual?',
    'reset.keep': 'Se conservará: El nombre de tu oponente y las configuraciones de tu plantilla.',
    'reset.cancel': 'Cancelar',
    'reset.confirm': 'Sí, restablecer',
    // Login
    'login.title': 'BeachHandball Stats',
    'login.subtitle': 'Registro táctico de alta velocidad',
    'login.google': 'Iniciar sesión con Google',
    'login.connecting': 'Conectando...',
    'login.note': 'Necesitas una cuenta de Google para acceder a la aplicación.',
    // General
    'loading': 'Cargando...',
  },
  ca: {
    // Header
    'app.title': 'BeachHandball Stats',
    // Tabs
    'tab.match': 'Partit',
    'tab.shootout': 'Shootout',
    'tab.analysis': 'Anàlisi',
    'tab.team': 'Equip',
    'tab.archive': 'Arxiu',
    // Header controls
    'btn.night': 'Nit',
    'btn.sun': 'Sol',
    'btn.reset': 'Reset',
    'btn.install': 'Instal·lar',
    'btn.logout': 'Tancar sessió',
    // Match results
    'match.set1': 'SET 1',
    'match.set2': 'SET 2',
    'match.finished': 'Finalitzat',
    'match.inProgress': 'En Curs',
    'match.pending': 'Pendent',
    'match.shootout': 'SHOOTOUT',
    // GameBoard
    'game.convocados': 'CONVOCATS',
    'game.convocados.desc': 'Selecciona qualsevol jugador per obrir el menú d\'accions.',
    'game.undo': 'Desfer',
    'game.excluded': 'Jugadors Exclosos / Sancions',
    'game.noExcluded': 'Cap (Força completa a pista)',
    'game.suspended': 'Sancionant',
    'game.rivalExclusion': '+ Exclusió Rival',
    'game.goldenGoal': 'Gol d\'Or',
    'game.passiveWarning': 'ADVERTÈNCIA DE JOC PASSIU!',
    'game.last15': 'ÚLTIMS 15 SEGONS: QUALSEVOL FALTA GREU COMPORTA DESQUALIFICACIÓ DIRECTA + PENAL 6M',
    // Player actions modal
    'action.goal': 'Anotar Gol',
    'action.goalkeeper': 'Accions de Porteria',
    'action.save': 'Aturada',
    'action.rivalMiss': 'Error Rival',
    'action.goalsConceded': 'Gols Encaixats (Rival)',
    'action.goalConceded1': 'Gol Encaixat +1',
    'action.goalConceded2': 'Gol Encaixat +2',
    'action.defense': 'Defensa',
    'action.recover': 'Recuperar',
    'action.misses': 'Errors',
    'action.missShot': 'Error',
    'action.missFly': 'Err Fly',
    'action.turnover': 'Pèrdua de Pilota',
    'action.badPass': 'Mala Passada',
    'action.steps': 'Passos',
    'action.fumble': 'Fumble',
    'action.discipline': 'Disciplina i Sancions',
    'action.exclusion': 'Exclusió',
    'action.redCard': 'Targeta Vermella',
    // Shootout
    'shootout.title': 'Desempat Shootout (Un contra el Porter)',
    'shootout.suddenDeath': '+ Mort Sobtada',
    'shootout.clearRound': 'Netejar Tanda',
    'shootout.confirm': '⚠️ Confirmar?',
    'shootout.selectPlayer': 'Tria quin jugador llançarà:',
    'shootout.shot': 'Va llançar',
    'shootout.toShoot': 'Per llançar',
    'shootout.vsGoal': 'Contra porteria',
    'shootout.miss': 'ERROR / ATURADA',
    'shootout.rivalMiss': 'ATURADA / FORA',
    // Analytics
    'analytics.title': 'Estadístiques de l\'Entrenador',
    'analytics.realtime': 'Mètriques en temps real',
    'analytics.points': 'Punts',
    'analytics.effectiveness': 'Efect.',
    'analytics.turnovers': 'Pèrdues',
    'analytics.shotEff': 'Efectivitat de Tir',
    'analytics.flyEff': 'Efectivitat de Fly',
    'analytics.gkEff': 'Efectivitat Porteria',
    'analytics.hits': 'Encertats',
    'analytics.stopped': 'Aturats',
    'analytics.turnoverBreakdown': 'Desglossament de Pèrdues',
    'analytics.badPasses': 'Passades Fallades',
    'analytics.stepsWalking': 'Passos (Walking)',
    'analytics.fumbling': 'Fumbling / Pèrdua del bot',
    'analytics.riskStrategy': 'Efectivitat Tàctica de Risc',
    'analytics.flySuccess': 'Encert del Fly',
    'analytics.pointsRatio': 'Ràtio de Punts',
    'analytics.flyInFlight': 'Èxit en In-Flight',
    'analytics.doublePoints': 'Punts via Dobles',
    'analytics.individual': 'Rendiment Individual',
    'analytics.goals1pt': 'Gol 1pt',
    'analytics.goals2pt': 'Gol 2pt',
    'analytics.saves': 'Aturades',
    'analytics.conceded': 'Encaixats',
    'analytics.savePercent': '% Atur.',
    'analytics.missed': 'Errors',
    'analytics.errFly': 'Err Fly',
    'analytics.losses': 'Pèrdues',
    'analytics.recoveries': 'Recup.',
    'analytics.points_label': 'Punts',
    'analytics.saves_label': 'Aturades',
    // Team
    'team.roster': 'Acta de Jugadors',
    'team.maxPlayers': 'Plantilla ampliada: Màx. 16 jugadors en acta.',
    'team.addPlayer': 'Afegir Jugador',
    'team.dorsal': 'Dorsal',
    'team.player': 'Jugador',
    'team.position': 'Posició Tàctica',
    'team.actions': 'Accions',
    // Archive
    'archive.save': 'Guardar Partit Actual',
    'archive.saveDesc': 'Guarda l\'estat actual del partit al núvol',
    'archive.saveName': 'Nom del partit (opcional)',
    'archive.saveBtn': 'Guardar',
    'archive.saving': 'Guardant...',
    'archive.saved': 'Partits Guardats',
    'archive.matchCount': 'partit(s) al núvol',
    'archive.load': 'Carregar',
    'archive.delete': 'Eliminar partit',
    'archive.confirmDelete': 'Confirmar',
    'archive.cancel': 'Cancel·lar',
    'archive.noMatches': 'No hi ha partits guardats',
    'archive.noMatchesDesc': 'Guarda el teu primer partit amb el botó de dalt',
    'archive.loading': 'Carregant partits...',
    // Reset
    'reset.title': 'Restablir Partit?',
    'reset.desc': 'Estàs segur que vols netejar tots els gols, exclusions, pèrdues i puntuacions del partit actual?',
    'reset.keep': 'Es conservarà: El nom del rival i les configuracions de la plantilla.',
    'reset.cancel': 'Cancel·lar',
    'reset.confirm': 'Sí, restablir',
    // Login
    'login.title': 'BeachHandball Stats',
    'login.subtitle': 'Registre tàctic d\'alta velocitat',
    'login.google': 'Iniciar sessió amb Google',
    'login.connecting': 'Connectant...',
    'login.note': 'Necessites un compte de Google per accedir a l\'aplicació.',
    // General
    'loading': 'Carregant...',
  },
  en: {
    // Header
    'app.title': 'BeachHandball Stats',
    // Tabs
    'tab.match': 'Match',
    'tab.shootout': 'Shootout',
    'tab.analysis': 'Analysis',
    'tab.team': 'Team',
    'tab.archive': 'Archive',
    // Header controls
    'btn.night': 'Night',
    'btn.sun': 'Sun',
    'btn.reset': 'Reset',
    'btn.install': 'Install',
    'btn.logout': 'Logout',
    // Match results
    'match.set1': 'SET 1',
    'match.set2': 'SET 2',
    'match.finished': 'Finished',
    'match.inProgress': 'Live',
    'match.pending': 'Pending',
    'match.shootout': 'SHOOTOUT',
    // GameBoard
    'game.convocados': 'SQUAD',
    'game.convocados.desc': 'Tap any player to open the actions menu.',
    'game.undo': 'Undo',
    'game.excluded': 'Excluded Players / Sanctions',
    'game.noExcluded': 'None (Full strength on court)',
    'game.suspended': 'Suspended',
    'game.rivalExclusion': '+ Rival Exclusion',
    'game.goldenGoal': 'Golden Goal',
    'game.passiveWarning': 'PASSIVE PLAY WARNING!',
    'game.last15': 'LAST 15 SECONDS: ANY SERIOUS FOUL LEADS TO DIRECT DISQUALIFICATION + 6M PENALTY',
    // Player actions modal
    'action.goal': 'Score Goal',
    'action.goalkeeper': 'Goalkeeper Actions',
    'action.save': 'Save',
    'action.rivalMiss': 'Rival Miss',
    'action.goalsConceded': 'Goals Conceded (Rival)',
    'action.goalConceded1': 'Goal Conceded +1',
    'action.goalConceded2': 'Goal Conceded +2',
    'action.defense': 'Defense',
    'action.recover': 'Recover',
    'action.misses': 'Misses',
    'action.missShot': 'Miss',
    'action.missFly': 'Fly Err',
    'action.turnover': 'Turnover',
    'action.badPass': 'Bad Pass',
    'action.steps': 'Steps',
    'action.fumble': 'Fumble',
    'action.discipline': 'Discipline & Sanctions',
    'action.exclusion': 'Exclusion',
    'action.redCard': 'Red Card',
    // Shootout
    'shootout.title': 'Shootout Tiebreaker (1v1 vs Goalkeeper)',
    'shootout.suddenDeath': '+ Sudden Death',
    'shootout.clearRound': 'Clear Round',
    'shootout.confirm': '⚠️ Confirm?',
    'shootout.selectPlayer': 'Choose which player will shoot:',
    'shootout.shot': 'Shot by',
    'shootout.toShoot': 'To shoot',
    'shootout.vsGoal': 'Against keeper',
    'shootout.miss': 'MISS / SAVE',
    'shootout.rivalMiss': 'SAVE / OUT',
    // Analytics
    'analytics.title': 'Coach Statistics',
    'analytics.realtime': 'Real-time metrics',
    'analytics.points': 'Points',
    'analytics.effectiveness': 'Eff.',
    'analytics.turnovers': 'Turnovers',
    'analytics.shotEff': 'Shot Effectiveness',
    'analytics.flyEff': 'Fly Effectiveness',
    'analytics.gkEff': 'GK Effectiveness',
    'analytics.hits': 'Scored',
    'analytics.stopped': 'Saved',
    'analytics.turnoverBreakdown': 'Turnover Breakdown',
    'analytics.badPasses': 'Bad Passes',
    'analytics.stepsWalking': 'Steps (Walking)',
    'analytics.fumbling': 'Fumbling / Lost dribble',
    'analytics.riskStrategy': 'Risk Tactical Effectiveness',
    'analytics.flySuccess': 'Fly Success',
    'analytics.pointsRatio': 'Points Ratio',
    'analytics.flyInFlight': 'In-Flight Success',
    'analytics.doublePoints': 'Points via Doubles',
    'analytics.individual': 'Individual Performance',
    'analytics.goals1pt': 'Goal 1pt',
    'analytics.goals2pt': 'Goal 2pt',
    'analytics.saves': 'Saves',
    'analytics.conceded': 'Conceded',
    'analytics.savePercent': '% Saves',
    'analytics.missed': 'Missed',
    'analytics.errFly': 'Fly Err',
    'analytics.losses': 'Turnovers',
    'analytics.recoveries': 'Recov.',
    'analytics.points_label': 'Points',
    'analytics.saves_label': 'Saves',
    // Team
    'team.roster': 'Player Roster',
    'team.maxPlayers': 'Extended squad: Max. 16 players on roster.',
    'team.addPlayer': 'Add Player',
    'team.dorsal': 'Number',
    'team.player': 'Player',
    'team.position': 'Tactical Position',
    'team.actions': 'Actions',
    // Archive
    'archive.save': 'Save Current Match',
    'archive.saveDesc': 'Save current match state to the cloud',
    'archive.saveName': 'Match name (optional)',
    'archive.saveBtn': 'Save',
    'archive.saving': 'Saving...',
    'archive.saved': 'Saved Matches',
    'archive.matchCount': 'match(es) in cloud',
    'archive.load': 'Load',
    'archive.delete': 'Delete match',
    'archive.confirmDelete': 'Confirm',
    'archive.cancel': 'Cancel',
    'archive.noMatches': 'No saved matches',
    'archive.noMatchesDesc': 'Save your first match using the button above',
    'archive.loading': 'Loading matches...',
    // Reset
    'reset.title': 'Reset Match?',
    'reset.desc': 'Are you sure you want to clear all goals, exclusions, turnovers and scores from the current match?',
    'reset.keep': 'Will keep: Opponent name and squad configurations.',
    'reset.cancel': 'Cancel',
    'reset.confirm': 'Yes, reset',
    // Login
    'login.title': 'BeachHandball Stats',
    'login.subtitle': 'High-speed tactical recording',
    'login.google': 'Sign in with Google',
    'login.connecting': 'Connecting...',
    'login.note': 'You need a Google account to access the application.',
    // General
    'loading': 'Loading...',
  },
};

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'es',
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('bh_stats_lang');
    if (saved === 'es' || saved === 'ca' || saved === 'en') return saved;
    return 'es';
  });

  useEffect(() => {
    localStorage.setItem('bh_stats_lang', lang);
  }, [lang]);

  const t = (key: string): string => {
    return translations[lang][key] || translations['es'][key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function LanguageSelector({ sunMode }: { sunMode: boolean }) {
  const { lang, setLang } = useI18n();

  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as Language)}
      className={`text-xs md:text-sm font-bold rounded-lg border px-2 py-1.5 cursor-pointer transition-colors outline-none ${
        sunMode
          ? 'bg-white border-gray-200 text-gray-800'
          : 'bg-zinc-800 border-zinc-700 text-white'
      }`}
      title="Idioma / Language"
    >
      <option value="es">🇪🇸 ES</option>
      <option value="ca">🏴 CA</option>
      <option value="en">🇬🇧 EN</option>
    </select>
  );
}
