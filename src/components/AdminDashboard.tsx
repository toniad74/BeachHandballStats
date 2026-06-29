import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Users, Loader2, RefreshCw, Ban, Unlock, Trash2 } from 'lucide-react';
import { useI18n } from '../i18n';

interface UserRecord {
  id: string;
  email: string;
  name: string;
  picture?: string;
  firstLogin: string;
  lastLogin: string;
  loginCount: number;
  blocked?: boolean;
}

interface AdminDashboardProps {
  sunMode: boolean;
}

export default function AdminDashboard({ sunMode }: AdminDashboardProps) {
  const { language } = useI18n();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ type: 'block' | 'unblock' | 'delete'; userId: string } | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const data: UserRecord[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserRecord));
      data.sort((a, b) => new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime());
      setUsers(data);
    } catch (e: any) {
      setError('Error loading users. Check Firestore rules.');
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const blockUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { blocked: true });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, blocked: true } : u));
    } catch (e) { console.error(e); }
    setConfirmAction(null);
  };

  const unblockUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { blocked: false });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, blocked: false } : u));
    } catch (e) { console.error(e); }
    setConfirmAction(null);
  };

  const deleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e) { console.error(e); }
    setConfirmAction(null);
  };

  const activeUsers = users.filter(u => !u.blocked);
  const blockedUsers = users.filter(u => u.blocked);

  return (
    <div className="p-3 md:p-6 space-y-5">
      <div className={`border-2 rounded-2xl p-5 md:p-7 ${sunMode ? 'bg-white border-indigo-200' : 'bg-zinc-900 border-indigo-800'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className={`w-7 h-7 ${sunMode ? 'text-indigo-600' : 'text-indigo-400'}`} />
            <div>
              <h2 className={`text-xl font-black uppercase ${sunMode ? 'text-gray-900' : 'text-white'}`}>Admin Dashboard</h2>
              <p className={`text-sm ${sunMode ? 'text-gray-500' : 'text-zinc-400'}`}>
                {activeUsers.length} activos · {blockedUsers.length} bloqueados
              </p>
            </div>
          </div>
          <button onClick={loadUsers} disabled={loading} className={`p-2.5 rounded-lg border transition active:scale-95 ${sunMode ? 'border-gray-200 hover:bg-gray-50' : 'border-zinc-700 hover:bg-zinc-800'}`}>
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''} ${sunMode ? 'text-gray-600' : 'text-zinc-400'}`} />
          </button>
        </div>

        {error && <p className="text-red-500 text-sm font-bold mb-4">{error}</p>}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="space-y-2">
            {users.map(user => (
              <div key={user.id} className={`flex items-center gap-3 p-3 md:p-4 rounded-xl border ${
                user.blocked
                  ? sunMode ? 'border-red-200 bg-red-50/50' : 'border-red-800 bg-red-950/20'
                  : sunMode ? 'border-gray-200 bg-gray-50' : 'border-zinc-700 bg-zinc-800'
              }`}>
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className={`w-10 h-10 rounded-full border ${user.blocked ? 'opacity-40 grayscale' : 'border-gray-300'}`} />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${sunMode ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-950 text-indigo-400'} ${user.blocked ? 'opacity-40' : ''}`}>
                    {user.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm truncate ${user.blocked ? 'line-through opacity-50' : ''} ${sunMode ? 'text-gray-900' : 'text-white'}`}>{user.name}</p>
                  <p className={`text-xs truncate ${sunMode ? 'text-gray-500' : 'text-zinc-400'}`}>{user.email}</p>
                </div>
                <div className="text-right flex-shrink-0 mr-2">
                  <p className={`text-[10px] font-bold ${sunMode ? 'text-gray-600' : 'text-zinc-300'}`}>{new Date(user.lastLogin).toLocaleDateString()}</p>
                  <p className={`text-[9px] ${sunMode ? 'text-gray-400' : 'text-zinc-500'}`}>{user.loginCount || 1}x</p>
                </div>
                {/* Actions */}
                <div className="flex gap-1.5 flex-shrink-0">
                  {user.blocked ? (
                    <button onClick={() => setConfirmAction({ type: 'unblock', userId: user.id })} className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 hover:bg-emerald-200 transition active:scale-95" title="Desbloquear">
                      <Unlock className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={() => setConfirmAction({ type: 'block', userId: user.id })} className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/30 text-amber-600 hover:bg-amber-200 transition active:scale-95" title="Bloquear">
                      <Ban className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => setConfirmAction({ type: 'delete', userId: user.id })} className="p-2 rounded-lg bg-red-100 dark:bg-red-950/30 text-red-600 hover:bg-red-200 transition active:scale-95" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setConfirmAction(null)}>
          <div className={`p-6 rounded-2xl max-w-sm w-full shadow-2xl border-2 text-center ${sunMode ? 'bg-white border-gray-200' : 'bg-zinc-900 border-zinc-700'}`} onClick={e => e.stopPropagation()}>
            {confirmAction.type === 'delete' && <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-3" />}
            {confirmAction.type === 'block' && <Ban className="w-10 h-10 text-amber-500 mx-auto mb-3" />}
            {confirmAction.type === 'unblock' && <Unlock className="w-10 h-10 text-emerald-500 mx-auto mb-3" />}
            <h3 className={`text-lg font-black mb-2 ${sunMode ? 'text-gray-900' : 'text-white'}`}>
              {confirmAction.type === 'delete' ? '¿Eliminar usuario?' : confirmAction.type === 'block' ? '¿Bloquear usuario?' : '¿Desbloquear usuario?'}
            </h3>
            <p className={`text-sm mb-5 ${sunMode ? 'text-gray-500' : 'text-zinc-400'}`}>
              {users.find(u => u.id === confirmAction.userId)?.email}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAction(null)} className={`flex-1 py-3 rounded-xl font-bold text-sm transition active:scale-95 ${sunMode ? 'bg-gray-100 text-gray-700' : 'bg-zinc-800 text-zinc-300'}`}>Cancelar</button>
              <button onClick={() => {
                if (confirmAction.type === 'block') blockUser(confirmAction.userId);
                else if (confirmAction.type === 'unblock') unblockUser(confirmAction.userId);
                else deleteUser(confirmAction.userId);
              }} className={`flex-1 py-3 rounded-xl font-black text-sm text-white transition active:scale-95 ${confirmAction.type === 'delete' ? 'bg-red-600' : confirmAction.type === 'block' ? 'bg-amber-500' : 'bg-emerald-600'}`}>
                {confirmAction.type === 'delete' ? 'Eliminar' : confirmAction.type === 'block' ? 'Bloquear' : 'Desbloquear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
