import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { useI18n } from '../i18n';

interface TutorialProps {
  onClose: () => void;
  sunMode: boolean;
}

export default function Tutorial({ onClose, sunMode }: TutorialProps) {
  const { language } = useI18n();
  const [page, setPage] = useState(0);

  const content = getContent(language);
  const totalPages = content.length;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 md:p-6">
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-2 shadow-2xl ${sunMode
        ? 'bg-white border-amber-200'
        : 'bg-zinc-900 border-zinc-700'
      }`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between p-4 md:p-5 border-b ${sunMode ? 'bg-white border-gray-200' : 'bg-zinc-900 border-zinc-800'}`}>
          <div>
            <h2 className={`text-lg md:text-xl font-black uppercase ${sunMode ? 'text-gray-900' : 'text-white'}`}>
              {language === 'en' ? 'Tutorial' : language === 'ca' ? 'Tutorial' : 'Tutorial'}
            </h2>
            <p className={`text-xs ${sunMode ? 'text-gray-500' : 'text-zinc-400'}`}>
              {page + 1} / {totalPages}
            </p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${sunMode ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-zinc-800 text-zinc-400'}`}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 md:p-8">
          <h3 className={`text-xl md:text-2xl font-black mb-4 ${sunMode ? 'text-gray-900' : 'text-white'}`}>
            {content[page].title}
          </h3>
          <div className={`space-y-3 text-sm md:text-base leading-relaxed ${sunMode ? 'text-gray-700' : 'text-zinc-300'}`}>
            {content[page].sections.map((section, i) => (
              <div key={i}>
                {section.subtitle && (
                  <h4 className={`font-bold text-base md:text-lg mt-4 mb-2 ${sunMode ? 'text-gray-900' : 'text-white'}`}>
                    {section.subtitle}
                  </h4>
                )}
                {section.items.map((item, j) => (
                  <p key={j} className="mb-2">• {item}</p>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className={`sticky bottom-0 flex items-center justify-between p-4 border-t ${sunMode ? 'bg-white border-gray-200' : 'bg-zinc-900 border-zinc-800'}`}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className={`flex items-center gap-1 px-4 py-2.5 rounded-xl font-bold text-sm transition active:scale-95 disabled:opacity-30 ${sunMode
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            {language === 'en' ? 'Back' : language === 'ca' ? 'Enrere' : 'Atrás'}
          </button>

          {page < totalPages - 1 ? (
            <button
              onClick={() => setPage(p => p + 1)}
              className="flex items-center gap-1 px-5 py-2.5 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-600 text-gray-900 transition active:scale-95"
            >
              {language === 'en' ? 'Next' : language === 'ca' ? 'Següent' : 'Siguiente'}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-5 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition active:scale-95"
            >
              {language === 'en' ? 'Got it!' : language === 'ca' ? 'Entès!' : '¡Entendido!'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface Section { subtitle?: string; items: string[]; }
interface Page { title: string; sections: Section[]; }

function getContent(lang: string): Page[] {
  if (lang === 'en') return contentEN;
  if (lang === 'ca') return contentCA;
  return contentES;
}

const contentES: Page[] = [
  {
    title: '👋 Bienvenido a BeachHandball Stats',
    sections: [
      { items: [
        'Esta app te permite registrar todas las estadísticas de un partido de beach handball en tiempo real.',
        'Está diseñada para usar en la playa con luz solar intensa: textos grandes, alto contraste y botones táctiles amplios.',
        'Los datos se guardan automáticamente en tu dispositivo. También puedes guardar partidos en la nube para no perderlos.',
      ]}
    ]
  },
  {
    title: '📋 Pestaña PARTIDO',
    sections: [
      { subtitle: 'Marcador y Reloj', items: [
        'El reloj cuenta atrás desde 10:00. Usa ▶ para iniciar y ⏸ para pausar.',
        'Toca el reloj para editar el tiempo manualmente.',
        'El marcador muestra la puntuación de ambos equipos. Toca el nombre del equipo para configurar nombre y color de camiseta.',
      ]},
      { subtitle: 'Registrar acciones', items: [
        'Toca la tarjeta de cualquier jugador para abrir el menú de acciones.',
        'Desde ahí puedes: anotar gol (+1 o +2), registrar fallos, pérdidas de balón, paradas, recuperaciones, o sanciones.',
        'Después de anotar un gol, aparece un modal para indicar quién dio la asistencia.',
        'El botón "Deshacer" revierte la última acción registrada.',
      ]},
      { subtitle: 'Sanciones', items: [
        'Las exclusiones se registran desde el menú del jugador.',
        'Las exclusiones rivales se añaden con el botón "+ Exclusión Rival".',
        'A los últimos 15 segundos suena una alarma y la pantalla se pone roja.',
      ]}
    ]
  },
  {
    title: '🎯 Pestaña SHOOTOUT',
    sections: [
      { items: [
        'Se activa cuando ambos sets quedan empates (1-1 en sets).',
        'Cada ronda tiene dos lanzamientos: tu equipo y el rival.',
        'Selecciona el tirador antes de registrar el resultado.',
        'Usa +2 (gol doble), +1 (gol simple) o ✗ (fallo) para cada lanzamiento.',
        'Si al final de las 5 rondas hay empate, añade "Muerte Súbita".',
      ]}
    ]
  },
  {
    title: '📊 Pestaña ANÁLISIS',
    sections: [
      { subtitle: 'Resumen global', items: [
        'Muestra puntos totales, efectividad de tiro y pérdidas del equipo.',
        'Tres gráficas circulares: efectividad de tiro, de fly y de portería.',
        'Desglose de pérdidas: pases fallados, pasos, fumbling.',
      ]},
      { subtitle: 'Rendimiento individual', items: [
        'Cada jugador aparece como una ficha con su puntuación destacada.',
        'Toca la ficha para ver el detalle completo: goles, fallos, pérdidas, paradas, asistencias.',
      ]},
      { subtitle: 'Exportar', items: [
        'Botón "Exportar PDF" genera un informe completo para imprimir o enviar.',
        'Botón "Exportar Excel" genera un archivo .xlsx con todos los datos para análisis.',
      ]}
    ]
  },
  {
    title: '👥 Pestaña EQUIPO',
    sections: [
      { items: [
        'Aquí gestionas tu plantilla de jugadores (máximo 16).',
        'Toca una tarjeta de jugador para editar su nombre, dorsal o posición.',
        'Usa "Sumar Jugador" para añadir nuevos jugadores.',
        'El icono de papelera elimina un jugador (requiere doble toque para confirmar).',
        'Las posiciones disponibles son: Portero, Especialista, Ala Izq., Ala Der., Pivote, Defensor.',
      ]}
    ]
  },
  {
    title: '☁️ Pestaña ARCHIVO',
    sections: [
      { items: [
        'Guarda el partido actual en la nube para recuperarlo después.',
        'Puedes darle un nombre personalizado o dejarlo automático.',
        'La lista muestra todos tus partidos guardados con su resultado.',
        'Usa "Cargar" para recuperar un partido y revisar sus datos.',
        'Usa la papelera para eliminar partidos que ya no necesites.',
      ]}
    ]
  },
  {
    title: '⚙️ Opciones y Consejos',
    sections: [
      { subtitle: 'Modo Sol / Noche', items: [
        'Usa el botón ☀️/🌙 para alternar entre modo claro (para sol) y oscuro (para sombra/noche).',
      ]},
      { subtitle: 'Idioma', items: [
        'Cambia el idioma con el selector ESP/CAT/ENG en la barra superior.',
      ]},
      { subtitle: 'Restablecer partido', items: [
        'El botón "Reset" borra todos los datos del partido actual pero conserva tu plantilla de jugadores.',
      ]},
      { subtitle: 'Instalar la app', items: [
        'Puedes instalar la app en tu tablet/móvil para usarla sin barra de navegador.',
        'Android: Menú ⋮ → Instalar app. iOS: Compartir → Añadir a inicio.',
      ]},
      { subtitle: 'Sin conexión', items: [
        'La app funciona sin internet. Los datos se guardan localmente.',
        'Cuando vuelvas a tener conexión, podrás guardar en la nube normalmente.',
      ]}
    ]
  },
];

const contentCA: Page[] = [
  { title: '👋 Benvingut a BeachHandball Stats', sections: [{ items: [
    "Aquesta app et permet registrar totes les estadístiques d'un partit de beach handball en temps real.",
    "Dissenyada per usar a la platja amb llum solar intensa: textos grans, alt contrast i botons tàctils amplis.",
    "Les dades es guarden automàticament al teu dispositiu. També pots guardar partits al núvol.",
  ]}]},
  { title: '📋 Pestanya PARTIT', sections: [
    { subtitle: 'Marcador i Rellotge', items: [
      'El rellotge compta enrere des de 10:00. Usa ▶ per iniciar i ⏸ per pausar.',
      'Toca el rellotge per editar el temps manualment.',
      "Toca el nom de l'equip per configurar nom i color de samarreta.",
    ]},
    { subtitle: 'Registrar accions', items: [
      "Toca la targeta de qualsevol jugador per obrir el menú d'accions.",
      "Pots: anotar gol (+1 o +2), registrar errors, pèrdues, aturades, recuperacions o sancions.",
      "Després d'anotar un gol, apareix un modal per indicar qui va donar l'assistència.",
      "El botó 'Desfer' reverteix l'última acció.",
    ]},
    { subtitle: 'Sancions', items: [
      'Les exclusions es registren des del menú del jugador.',
      "Les exclusions rivals s'afegeixen amb '+ Exclusió Rival'.",
      "Als últims 15 segons sona una alarma i la pantalla es posa vermella.",
    ]}
  ]},
  { title: '🎯 Pestanya SHOOTOUT', sections: [{ items: [
    "S'activa quan ambdós sets queden empatats (1-1 en sets).",
    'Cada ronda té dos llançaments: el teu equip i el rival.',
    'Selecciona el tirador abans de registrar el resultat.',
    'Usa +2 (gol doble), +1 (gol simple) o ✗ (fallada).',
    "Si al final de les 5 rondes hi ha empat, afegeix 'Mort Sobtada'.",
  ]}]},
  { title: '📊 Pestanya ANÀLISI', sections: [
    { subtitle: 'Resum global', items: [
      "Mostra punts totals, efectivitat de tir i pèrdues de l'equip.",
      'Tres gràfiques circulars: efectivitat de tir, de fly i de porteria.',
    ]},
    { subtitle: 'Rendiment individual', items: [
      'Cada jugador apareix com una fitxa amb la seva puntuació destacada.',
      'Toca la fitxa per veure el detall complet.',
    ]},
    { subtitle: 'Exportar', items: [
      "'Exportar PDF' genera un informe complet.",
      "'Exportar Excel' genera un arxiu .xlsx amb totes les dades.",
    ]}
  ]},
  { title: '👥 Pestanya EQUIP', sections: [{ items: [
    'Aquí gestiones la teva plantilla (màxim 16 jugadors).',
    'Toca una targeta per editar nom, dorsal o posició.',
    "'Afegir Jugador' per crear nous jugadors.",
    "La paperera elimina un jugador (requereix doble toc per confirmar).",
  ]}]},
  { title: '☁️ Pestanya ARXIU', sections: [{ items: [
    'Guarda el partit actual al núvol per recuperar-lo després.',
    "Pots donar-li un nom personalitzat.",
    "'Carregar' per recuperar un partit i revisar les dades.",
  ]}]},
  { title: '⚙️ Opcions i Consells', sections: [
    { subtitle: 'Mode Sol / Nit', items: ["Usa el botó ☀️/🌙 per alternar entre mode clar i fosc."]},
    { subtitle: 'Idioma', items: ["Canvia l'idioma amb el selector ESP/CAT/ENG."]},
    { subtitle: 'Restablir partit', items: ["El botó 'Reset' esborra totes les dades però conserva la plantilla."]},
    { subtitle: "Instal·lar l'app", items: ["Android: Menú ⋮ → Instal·lar. iOS: Compartir → Afegir a inici."]},
    { subtitle: 'Sense connexió', items: ["L'app funciona sense internet. Les dades es guarden localment."]},
  ]},
];

const contentEN: Page[] = [
  { title: '👋 Welcome to BeachHandball Stats', sections: [{ items: [
    'This app lets you record all match statistics for beach handball in real time.',
    'Designed for beach use in bright sunlight: large text, high contrast, and big touch targets.',
    'Data is saved automatically on your device. You can also save matches to the cloud.',
  ]}]},
  { title: '📋 MATCH Tab', sections: [
    { subtitle: 'Scoreboard & Clock', items: [
      'The clock counts down from 10:00. Use ▶ to start and ⏸ to pause.',
      'Tap the clock to edit time manually.',
      'Tap the team name to configure name and shirt color.',
    ]},
    { subtitle: 'Recording actions', items: [
      "Tap any player's card to open the action menu.",
      'From there: score goals (+1 or +2), record misses, turnovers, saves, recoveries, or sanctions.',
      'After scoring a goal, a modal appears to select who assisted.',
      'The "Undo" button reverts the last action.',
    ]},
    { subtitle: 'Sanctions', items: [
      "Exclusions are recorded from the player's menu.",
      'Rival exclusions are added with "+ Rival Exclusion".',
      'In the last 15 seconds an alarm sounds and the screen turns red.',
    ]}
  ]},
  { title: '🎯 SHOOTOUT Tab', sections: [{ items: [
    'Activates when both sets are tied (1-1 in sets).',
    'Each round has two shots: your team and the rival.',
    'Select the shooter before recording the result.',
    'Use +2 (double goal), +1 (simple goal) or ✗ (miss).',
    'If tied after 5 rounds, add "Sudden Death".',
  ]}]},
  { title: '📊 STATS Tab', sections: [
    { subtitle: 'Team overview', items: [
      'Shows total points, shot effectiveness and turnovers.',
      'Three circular gauges: shot, fly, and goalkeeper effectiveness.',
    ]},
    { subtitle: 'Individual performance', items: [
      'Each player appears as a card with their key stat highlighted.',
      'Tap to expand and see full details.',
    ]},
    { subtitle: 'Export', items: [
      '"Export PDF" generates a complete report.',
      '"Export Excel" generates an .xlsx file with all data.',
    ]}
  ]},
  { title: '👥 TEAM Tab', sections: [{ items: [
    'Manage your squad here (max 16 players).',
    'Tap a player card to edit name, number or position.',
    '"Add Player" to create new players.',
    'The trash icon removes a player (requires double tap to confirm).',
  ]}]},
  { title: '☁️ ARCHIVE Tab', sections: [{ items: [
    'Save the current match to the cloud.',
    'You can give it a custom name.',
    '"Load" to retrieve a match and review its data.',
  ]}]},
  { title: '⚙️ Options & Tips', sections: [
    { subtitle: 'Sun / Night Mode', items: ['Use the ☀️/🌙 button to toggle light/dark mode.']},
    { subtitle: 'Language', items: ['Change language with the ESP/CAT/ENG selector.']},
    { subtitle: 'Reset match', items: ['"Reset" clears all match data but keeps your squad.']},
    { subtitle: 'Install the app', items: ['Android: Menu ⋮ → Install app. iOS: Share → Add to Home Screen.']},
    { subtitle: 'Offline', items: ['The app works without internet. Data is saved locally.']},
  ]},
];
