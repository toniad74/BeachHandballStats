import React, { useState } from 'react';
import { Player, PlayerPosition } from '../types';
import { Users, UserPlus, Trash2, X, Check } from 'lucide-react';
import { useI18n } from '../i18n';
import { translatePosition } from '../utils/i18n';

interface SetupTeamProps {
  players: Player[];
  onUpdatePlayers: (players: Player[]) => void;
}

const POSITIONS: { value: PlayerPosition; color: string }[] = [
  { value: 'Portero', color: 'bg-amber-500' },
  { value: 'Especialista', color: 'bg-purple-500' },
  { value: 'Ala Izq.', color: 'bg-blue-500' },
  { value: 'Ala Der.', color: 'bg-blue-500' },
  { value: 'Pivote', color: 'bg-orange-500' },
  { value: 'Defensor', color: 'bg-slate-600' },
];

export default function SetupTeam({ players, onUpdatePlayers }: SetupTeamProps) {
  const { t } = useI18n();
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState(1);
  const [editPosition, setEditPosition] = useState<PlayerPosition>('Ala Izq.');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);

  const sortedPlayers = [...players].sort((a, b) => {
    const priority = (p: Player) => {
      if (p.position === 'Portero') return 0;
      if (p.position === 'Especialista') return 1;
      if (p.position === 'Polivalente') return 2;
      return 3;
    };
    return priority(a) - priority(b);
  });

  const openEdit = (player: Player) => {
    setEditingPlayer(player);
    setEditName(player.name);
    setEditNumber(player.number);
    setEditPosition(player.position);
  };

  const saveEdit = () => {
    if (!editingPlayer || !editName.trim()) return;
    const updated = players.map(p =>
      p.id === editingPlayer.id
        ? { ...p, name: editName.trim(), number: editNumber, position: editPosition }
        : p
    );
    onUpdatePlayers(updated);
    setEditingPlayer(null);
  };

  const deletePlayer = (id: string) => {
    if (players.length <= 4) return;
    onUpdatePlayers(players.filter(p => p.id !== id));
    setDeleteConfirmId(null);
  };

  const createPlayer = () => {
    if (players.length >= 16) return;
    const usedNumbers = players.map(p => p.number);
    const newNumber = Array.from({ length: 99 }, (_, i) => i + 1).find(n => !usedNumbers.includes(n)) || 1;
    const newPlayer: Player = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: t.newPlayer, number: newNumber, position: 'Ala Izq.',
      isActiveOnCourt: false, exclusions: 0, isDisqualified: false,
      goals1p: 0, goals2p: 0, assists: 0, missedShots: 0, missedFlies: 0,
      turnoverBadPass: 0, turnoverSteps: 0, turnoverFumbling: 0, recoveries: 0,
    };
    onUpdatePlayers([...players, newPlayer]);
    openEdit(newPlayer);
  };

  const getPositionColor = (pos: PlayerPosition) => {
    return POSITIONS.find(p => p.value === pos)?.color || 'bg-gray-500';
  };

  return (
    <div className="max-w-5xl mx-auto p-3 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7 text-amber-500" />
          <div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase">
              {t.playerRoster} ({players.length}/16)
            </h2>
            <p className="text-xs md:text-sm text-gray-500 dark:text-zinc-400">{t.maxPlayers}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {deleteAllConfirm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { onUpdatePlayers([]); setDeleteAllConfirm(false); }}
                className="bg-red-600 hover:bg-red-700 text-white font-black text-sm py-2.5 px-4 rounded-xl transition active:scale-95"
              >
                {t.confirm}
              </button>
              <button
                onClick={() => setDeleteAllConfirm(false)}
                className="bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-white font-bold text-sm py-2.5 px-4 rounded-xl transition active:scale-95"
              >
                {t.cancel}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDeleteAllConfirm(true)}
              disabled={players.length === 0}
              className="flex items-center gap-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-950/30 dark:hover:bg-red-950/50 disabled:opacity-30 font-bold text-sm py-2.5 px-3 text-red-600 dark:text-red-400 rounded-xl transition active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={createPlayer}
            disabled={players.length >= 16}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 font-black text-sm md:text-base py-2.5 md:py-3 px-4 md:px-5 text-gray-900 rounded-xl shadow transition active:scale-95"
          >
            <UserPlus className="w-5 h-5" />
            {t.addPlayer}
          </button>
        </div>
      </div>

      {/* Player Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {sortedPlayers.map(player => (
          <div
            key={player.id}
            onClick={() => openEdit(player)}
            className={`border-2 rounded-2xl p-4 md:p-5 cursor-pointer transition-all active:scale-[0.98] hover:shadow-lg ${
              player.position === 'Portero' ? 'border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20'
              : player.position === 'Especialista' ? 'border-purple-300 dark:border-purple-700 bg-purple-50/40 dark:bg-purple-950/20'
              : player.position === 'Polivalente' ? 'border-teal-300 dark:border-teal-700 bg-teal-50/40 dark:bg-teal-950/20'
              : 'border-gray-200 dark:border-zinc-700 bg-white/40 dark:bg-zinc-900/40'
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Dorsal badge */}
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center font-black text-xl md:text-2xl text-white flex-shrink-0 shadow ${getPositionColor(player.position)}`}>
                {player.number}
              </div>
              {/* Name + Position */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase truncate">
                  {player.name}
                </h3>
                <span className={`text-sm md:text-base font-bold uppercase ${
                  player.position === 'Portero' ? 'text-amber-600 dark:text-amber-400'
                  : player.position === 'Especialista' ? 'text-purple-600 dark:text-purple-400'
                  : player.position === 'Polivalente' ? 'text-teal-600 dark:text-teal-400'
                  : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {translatePosition(player.position, t)}
                </span>
                {player.isDisqualified && (
                  <span className="ml-2 text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold uppercase">DQ</span>
                )}
              </div>
              {/* Delete button */}
              {deleteConfirmId === player.id ? (
                <div className="flex gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => deletePlayer(player.id)} className="bg-red-600 text-white p-2 rounded-lg text-xs font-bold active:scale-95">✓</button>
                  <button onClick={() => setDeleteConfirmId(null)} className="bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-white p-2 rounded-lg text-xs font-bold active:scale-95">✗</button>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(player.id); }}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition flex-shrink-0"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* EDIT MODAL */}
      {editingPlayer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setEditingPlayer(null)}>
          <div className="bg-white dark:bg-zinc-900 border-2 border-amber-300 dark:border-amber-700 p-6 md:p-8 rounded-2xl max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg md:text-xl font-black uppercase text-gray-900 dark:text-white">
                ✏️ {editName || t.player}
              </h3>
              <button onClick={() => setEditingPlayer(null)} className="p-2 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:text-gray-800 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase text-gray-500 dark:text-zinc-400 mb-1.5">{t.player}</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white font-bold text-lg"
                autoFocus
              />
            </div>

            {/* Number */}
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase text-gray-500 dark:text-zinc-400 mb-1.5">{t.dorsal}</label>
              <input
                type="number" min={1} max={99}
                value={editNumber}
                onChange={e => setEditNumber(parseInt(e.target.value) || 1)}
                className="w-24 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white font-mono font-black text-2xl text-center"
              />
            </div>

            {/* Position Grid */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase text-gray-500 dark:text-zinc-400 mb-2">{t.position}</label>
              <div className="grid grid-cols-2 gap-2">
                {POSITIONS.map(pos => (
                  <button
                    key={pos.value}
                    onClick={() => setEditPosition(pos.value)}
                    className={`p-3 rounded-xl text-left font-bold text-sm transition active:scale-95 border-2 ${
                      editPosition === pos.value
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-gray-900 dark:text-white'
                        : 'border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-750'
                    }`}
                  >
                    {translatePosition(pos.value, t)}
                  </button>
                ))}
              </div>
            </div>

            {/* Save */}
            <button
              onClick={saveEdit}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-xl transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              {t.save}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
