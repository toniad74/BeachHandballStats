import React, { useState } from 'react';
import { Player, PlayerPosition } from '../types';
import { Shield, Users, UserPlus, Trash2, Edit2, Check, X } from 'lucide-react';
import { useI18n } from '../i18n';

interface SetupTeamProps {
  players: Player[];
  onUpdatePlayers: (players: Player[]) => void;
}

export default function SetupTeam({
  players,
  onUpdatePlayers,
}: SetupTeamProps) {
  const { t } = useI18n();
  // For adding/editing players
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState<number>(1);
  const [editPosition, setEditPosition] = useState<PlayerPosition>('Ala Izq.');

  // Modal for changing a player's position
  const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
  const [modalPlayerId, setModalPlayerId] = useState<string | null>(null);
  const [modalPlayerName, setModalPlayerName] = useState('');
  const [modalCurrentPosition, setModalCurrentPosition] = useState<PlayerPosition>('Ala Izq.');

  const handleStartEdit = (player: Player) => {
    setEditingId(player.id);
    setEditName(player.name);
    setEditNumber(player.number);
    setEditPosition(player.position);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    const updated = players.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          name: editName,
          number: editNumber,
          position: editPosition,
        };
      }
      return p;
    });
    onUpdatePlayers(updated);
    setEditingId(null);
  };

  const handleDeletePlayer = (id: string) => {
    if (players.length <= 4) {
      alert('Se requieren mínimo 4 jugadores activos en el acta.');
      return;
    }
    const filtered = players.filter((p) => p.id !== id);
    onUpdatePlayers(filtered);
  };

  const handleCreatePlayer = () => {
    if (players.length >= 16) {
      alert('Se permite un máximo de 16 jugadores por acta en esta configuración ampliada.');
      return;
    }

    const availableNumbers = Array.from({ length: 99 }, (_, i) => i + 1).filter(
      (n) => !players.some((p) => p.number === n)
    );
    const newNumber = availableNumbers[0] || 11;

    const newPlayer: Player = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: `Jugador Nuevo`,
      number: newNumber,
      position: 'Ala Izq.',
      isActiveOnCourt: players.filter(p => p.isActiveOnCourt).length < 4, // auto active if court < 4
      exclusions: 0,
      isDisqualified: false,
      goals1p: 0,
      goals2p: 0,
      missedShots: 0,
      missedFlies: 0,
      turnoverBadPass: 0,
      turnoverSteps: 0,
      turnoverFumbling: 0,
      recoveries: 0,
    };

    onUpdatePlayers([...players, newPlayer]);
  };


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
    <div className="max-w-5xl mx-auto space-y-5 md:space-y-8 p-3 md:p-6">
      

        {/* Player Roster Management (Up to 16) */}
        <div className="bg-background border-2 border-amber-500 rounded-2xl shadow-xl p-5" id="roster_management_card">
          <div className="flex justify-between items-center mb-4 border-b border-gray-150 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-amber-500" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                  {t.playerRoster} ({players.length}/16)
                </h2>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  {t.maxPlayers}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleCreatePlayer}
              disabled={players.length >= 16}
              className="flex items-center gap-1.5 bg-amber-500 disabled:opacity-50 hover:bg-amber-600 font-extrabold text-sm py-2 px-3 text-gray-900 rounded-lg shadow transition duration-200"
              id="add_player_btn"
            >
              <UserPlus className="w-4 h-4" />
              {t.addPlayer}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 dark:bg-zinc-800 text-left text-gray-700 dark:text-zinc-200 text-sm font-bold uppercase tracking-wider">
                  <th className="py-3 px-3 w-16 text-center">{t.dorsal}</th>
                  <th className="py-3 px-4">{t.player}</th>
                  <th className="py-3 px-4 w-40">{t.position}</th>
                  <th className="py-3 px-4 w-32 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                {sortedPlayers.map((player) => {
                  const isEditing = editingId === player.id;
                  return (
                    <tr
                      key={player.id}
                      className={`hover:bg-amber-50/40 dark:hover:bg-zinc-800/40 transition duration-150 ${
                        player.isActiveOnCourt ? 'bg-amber-50/20 dark:bg-zinc-800/10' : ''
                      }`}
                    >
                      {/* PLAYER JACKET NUMBER */}
                      <td className="py-3 px-2 text-center font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            max="99"
                            className="bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 border-2 border-gray-300 dark:border-zinc-600 rounded p-1 w-12 text-center font-bold"
                            value={editNumber}
                            onChange={(e) => setEditNumber(parseInt(e.target.value) || 1)}
                          />
                        ) : (
                          <span className="text-lg font-extrabold text-gray-900 dark:text-white">
                            #{player.number}
                          </span>
                        )}
                      </td>

                      {/* PLAYER NAME */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="text"
                            className="bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 border-2 border-gray-300 dark:border-zinc-600 rounded p-1 w-full font-bold text-sm"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        ) : (
                          <div>
                            <span className="font-bold text-gray-900 dark:text-white text-base">
                              {player.name}
                            </span>
                            {player.isDisqualified && (
                              <span className="ml-2 bg-red-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                                Descalificado
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Tactical Position */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <button
                            type="button"
                            onClick={() => {
                              setModalPlayerId(player.id);
                              setModalPlayerName(editName);
                              setModalCurrentPosition(editPosition);
                              setIsPositionModalOpen(true);
                            }}
                            className="w-full bg-orange-100 dark:bg-orange-950 text-orange-900 dark:text-orange-200 text-xs font-black px-3 py-2.5 rounded-xl border border-orange-300 dark:border-orange-850 text-left flex justify-between items-center transition hover:bg-orange-200 dark:hover:bg-orange-900/60 active:scale-98"
                          >
                            <span>{editPosition}</span>
                            <span className="text-sm">⚙️</span>
                          </button>
                        ) : (
                          <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full uppercase border ${
                            player.position === 'Portero'
                              ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300/30'
                              : player.position === 'Especialista'
                              ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300 border-purple-300/30'
                              : player.position === 'Polivalente'
                              ? 'bg-teal-100 dark:bg-teal-950/40 text-teal-900 dark:text-teal-300 border-teal-300/30'
                              : 'bg-orange-100 dark:bg-orange-950/40 text-orange-900 dark:text-orange-300 border-orange-300/30'
                          }`}>
                            {player.position}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2.5">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(player.id)}
                                className="bg-green-500 hover:bg-green-600 text-white p-2.5 rounded-xl transition duration-150 active:scale-90 shadow-sm"
                                title="Guardar"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-xl transition duration-150 active:scale-90 shadow-sm"
                                title="Cancelar"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartEdit(player)}
                                className="bg-blue-500 hover:bg-blue-600 text-white p-2.5 rounded-xl transition duration-150 active:scale-90 shadow-sm"
                                title="Editar Jugador"
                              >
                                <Edit2 className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeletePlayer(player.id)}
                                className="bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-xl transition duration-150 active:scale-90 shadow-sm"
                                title="Eliminar de Acta"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      {/* POSICIÓN TÁCTICA SELECTION WINDOW/MODAL */}
      {isPositionModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-sand-200 dark:border-zinc-800 p-6 rounded-2xl max-w-md w-full mx-4 shadow-2xl relative">
            <button
              onClick={() => setIsPositionModalOpen(false)}
              className="absolute top-4 right-4 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-750 text-gray-500 hover:text-gray-800 dark:hover:text-white p-2 rounded-full transition-colors flex items-center justify-center"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider mb-2">
              Posición Táctica
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">
              Posición para <strong className="text-primary">{modalPlayerName}</strong>:
            </p>
 
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {[
                { value: 'Ala Izq.', label: 'Ala Izq.', desc: '🏹 Extremo izquierdo', color: 'border-l-4 border-amber-500' },
                { value: 'Ala Der.', label: 'Ala Der.', desc: '🏹 Extremo derecho', color: 'border-l-4 border-amber-500' },
                { value: 'Pivote', label: 'Pivote', desc: '🔄 Jugador central (sólo ataque)', color: 'border-l-4 border-orange-500' },
                { value: 'Especialista', label: 'Especialista', desc: '⭐ Goles dobles (sólo ataque)', color: 'border-l-4 border-violet-500' },
                { value: 'Portero', label: 'Portero', desc: '🧤 Portería y goles dobles (sólo defensa)', color: 'border-l-4 border-emerald-500' },
                { value: 'Defensor', label: 'Defensor', desc: '🛡️ Especialista defensivo', color: 'border-l-4 border-blue-500' },
                { value: 'Polivalente', label: 'Polivalente', desc: '🔄 Juego en Ataque y Defensa', color: 'border-l-4 border-teal-500' },
                { value: 'Ala', label: 'Ala', desc: '🏃 Posición alternativa', color: 'border-l-4 border-gray-400' },
              ].map((opt) => {
                const isSelected = modalCurrentPosition === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setEditPosition(opt.value as PlayerPosition);
                      setModalCurrentPosition(opt.value as PlayerPosition);
                      setIsPositionModalOpen(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-150 active:scale-[0.99] flex flex-col gap-1 ${opt.color} ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 dark:bg-amber-950/20'
                        : 'bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-850'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-extrabold text-sm text-slate-950 dark:text-white uppercase">
                        {opt.label}
                      </span>
                      {isSelected && (
                        <span className="text-xs bg-amber-500 text-gray-900 px-2 py-0.5 rounded-md font-black uppercase">
                          ACTUAL
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-zinc-400">
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPositionModalOpen(false)}
                className="bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-gray-200 dark:hover:bg-zinc-700 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
