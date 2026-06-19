import React, { useState, useEffect } from 'react';
import { MatchState, SavedMatch, GoogleUser } from '../types';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { Save, FolderOpen, Trash2, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface MatchHistoryProps {
  user: GoogleUser;
  currentMatchState: MatchState;
  onLoadMatch: (matchState: MatchState) => void;
  sunMode: boolean;
}

export default function MatchHistory({ user, currentMatchState, onLoadMatch, sunMode }: MatchHistoryProps) {
  const [savedMatches, setSavedMatches] = useState<SavedMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [customLabel, setCustomLabel] = useState('');

  // Load saved matches on mount
  useEffect(() => {
    loadMatches();
  }, [user.id]);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'matches'),
        where('userId', '==', user.id)
      );
      const snapshot = await getDocs(q);
      const matches: SavedMatch[] = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      } as SavedMatch));
      // Sort by date on the client (avoids needing a composite index)
      matches.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
      setSavedMatches(matches);
    } catch (error: any) {
      console.error('Error loading matches:', error);
      setMessage({ type: 'error', text: 'Error al cargar partidos. Verifica tu conexión.' });
    } finally {
      setLoading(false);
    }
  };

  const saveCurrentMatch = async () => {
    setSaving(true);
    setMessage(null);

    const { set1, set2, ourTeamName, opponentName } = currentMatchState;
    const teamName = ourTeamName || 'Mi Equipo';
    const rivalName = opponentName || 'Oponente';

    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    const label = customLabel.trim() || `${teamName} vs ${rivalName} — ${dateStr}`;
    const finalScore = `Set1: ${set1.usScore}-${set1.themScore} | Set2: ${set2.usScore}-${set2.themScore}`;

    const matchToSave: Omit<SavedMatch, 'id'> = {
      userId: user.id,
      matchState: currentMatchState,
      savedAt: now.toISOString(),
      label,
      ourTeamName: teamName,
      opponentName: rivalName,
      finalScore,
    };

    try {
      await addDoc(collection(db, 'matches'), matchToSave);
      setMessage({ type: 'success', text: `Partido guardado: "${label}"` });
      setCustomLabel('');
      await loadMatches();
    } catch (error: any) {
      console.error('Error saving match:', error);
      setMessage({ type: 'error', text: 'Error al guardar. Verifica tu conexión a internet.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const deleteMatch = async (matchId: string) => {
    try {
      await deleteDoc(doc(db, 'matches', matchId));
      setSavedMatches(prev => prev.filter(m => m.id !== matchId));
      setMessage({ type: 'success', text: 'Partido eliminado.' });
      setDeleteConfirmId(null);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error al eliminar el partido.' });
    }
    setTimeout(() => setMessage(null), 4000);
  };

  const handleLoadMatch = (match: SavedMatch) => {
    onLoadMatch(match.matchState);
    setMessage({ type: 'success', text: `Partido cargado: "${match.label}"` });
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className="p-3 md:p-6 space-y-6 md:space-y-8">

      {/* SAVE CURRENT MATCH */}
      <div className={`border-2 rounded-2xl p-5 md:p-7 ${sunMode
        ? 'bg-white border-emerald-200 shadow-md'
        : 'bg-charcoal-900 border-emerald-800 shadow-lg'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <Save className={`w-7 h-7 md:w-8 md:h-8 ${sunMode ? 'text-emerald-600' : 'text-emerald-400'}`} />
          <div>
            <h2 className={`text-lg md:text-xl font-black uppercase ${sunMode ? 'text-gray-900' : 'text-white'}`}>
              Guardar Partido Actual
            </h2>
            <p className={`text-xs md:text-sm ${sunMode ? 'text-gray-500' : 'text-zinc-400'}`}>
              Guarda el estado actual del partido en la nube
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="Nombre del partido (opcional)"
            className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm md:text-base font-medium ${sunMode
              ? 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              : 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
            }`}
          />
          <button
            onClick={saveCurrentMatch}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-6 rounded-xl text-sm md:text-base uppercase tracking-wider transition active:scale-95 disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* MESSAGE */}
      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border-2 text-sm md:text-base font-bold ${
          message.type === 'success'
            ? sunMode ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-950/30 border-emerald-700 text-emerald-300'
            : sunMode ? 'bg-red-50 border-red-200 text-red-700' : 'bg-red-950/30 border-red-700 text-red-300'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {message.text}
        </div>
      )}

      {/* SAVED MATCHES LIST */}
      <div className={`border-2 rounded-2xl p-5 md:p-7 ${sunMode
        ? 'bg-white border-blue-200 shadow-md'
        : 'bg-charcoal-900 border-blue-800 shadow-lg'
      }`}>
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <FolderOpen className={`w-7 h-7 md:w-8 md:h-8 ${sunMode ? 'text-blue-600' : 'text-blue-400'}`} />
            <div>
              <h2 className={`text-lg md:text-xl font-black uppercase ${sunMode ? 'text-gray-900' : 'text-white'}`}>
                Partidos Guardados
              </h2>
              <p className={`text-xs md:text-sm ${sunMode ? 'text-gray-500' : 'text-zinc-400'}`}>
                {savedMatches.length} partido{savedMatches.length !== 1 ? 's' : ''} en la nube
              </p>
            </div>
          </div>
          <button
            onClick={loadMatches}
            disabled={loading}
            className={`p-2.5 rounded-lg border transition active:scale-95 ${sunMode
              ? 'border-gray-200 hover:bg-gray-50 text-gray-600'
              : 'border-zinc-700 hover:bg-zinc-800 text-zinc-400'
            }`}
            title="Actualizar lista"
          >
            <Loader2 className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className={`w-8 h-8 animate-spin ${sunMode ? 'text-blue-500' : 'text-blue-400'}`} />
            <span className={`ml-3 text-sm font-bold ${sunMode ? 'text-gray-500' : 'text-zinc-400'}`}>Cargando partidos...</span>
          </div>
        ) : savedMatches.length === 0 ? (
          <div className={`text-center py-12 rounded-xl border-2 border-dashed ${sunMode
            ? 'border-gray-200 text-gray-400'
            : 'border-zinc-700 text-zinc-500'
          }`}>
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm md:text-base font-bold">No hay partidos guardados</p>
            <p className="text-xs md:text-sm mt-1">Guarda tu primer partido usando el botón de arriba</p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {savedMatches.map((match) => {
              const savedDate = new Date(match.savedAt);
              const dateDisplay = savedDate.toLocaleDateString('es-ES', {
                day: '2-digit', month: 'short', year: 'numeric'
              });
              const timeDisplay = savedDate.toLocaleTimeString('es-ES', {
                hour: '2-digit', minute: '2-digit'
              });

              return (
                <div
                  key={match.id}
                  className={`border-2 rounded-xl p-4 md:p-5 transition-all ${sunMode
                    ? 'border-gray-200 bg-gray-50/50 hover:border-blue-300 hover:bg-blue-50/30'
                    : 'border-zinc-700 bg-zinc-800/50 hover:border-blue-600 hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Match Info */}
                    <div className="min-w-0 flex-1">
                      <h3 className={`text-base md:text-lg font-black truncate ${sunMode ? 'text-gray-900' : 'text-white'}`}>
                        {match.label}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className={`text-sm md:text-base font-mono font-bold px-2.5 py-0.5 rounded ${sunMode
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-amber-950/40 text-amber-300'
                        }`}>
                          {match.finalScore}
                        </span>
                        <span className={`text-xs md:text-sm ${sunMode ? 'text-gray-500' : 'text-zinc-400'}`}>
                          {dateDisplay} · {timeDisplay}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleLoadMatch(match)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 md:py-3 px-4 md:px-5 rounded-xl text-xs md:text-sm uppercase tracking-wider transition active:scale-95 flex items-center gap-1.5"
                      >
                        <FolderOpen className="w-4 h-4" />
                        Cargar
                      </button>
                      {deleteConfirmId === match.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => deleteMatch(match.id!)}
                            className="bg-red-600 hover:bg-red-700 text-white font-black py-2.5 md:py-3 px-3 md:px-4 rounded-xl text-xs uppercase transition active:scale-95"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className={`py-2.5 md:py-3 px-3 rounded-xl text-xs font-bold border transition active:scale-95 ${sunMode
                              ? 'border-gray-200 text-gray-600 hover:bg-gray-100'
                              : 'border-zinc-600 text-zinc-300 hover:bg-zinc-700'
                            }`}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(match.id!)}
                          className={`p-2.5 md:p-3 rounded-xl border transition active:scale-95 ${sunMode
                            ? 'border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300'
                            : 'border-red-800 text-red-400 hover:bg-red-950/30 hover:border-red-600'
                          }`}
                          title="Eliminar partido"
                        >
                          <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
