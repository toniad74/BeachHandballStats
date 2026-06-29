import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Users, Loader2, RefreshCw } from 'lucide-react';
import { useI18n } from '../i18n';

interface UserRecord {
  id: string;
  email: string;
  name: string;
  picture?: string;
  firstLogin: string;
  lastLogin: string;
  loginCount: number;
}

interface AdminDashboardProps {
  sunMode: boolean;
}

export default function AdminDashboard({ sunMode }: AdminDashboardProps) {
  const { language } = useI18n();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const data: UserRecord[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as UserRecord));
      data.sort((a, b) => new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime());
      setUsers(data);
    } catch (e: any) {
      setError(language === 'en' ? 'Error loading users. Check Firestore rules.' : 'Error al cargar usuarios. Revisa las reglas de Firestore.');
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  return (
    <div className="p-3 md:p-6 space-y-5">
      <div className={`border-2 rounded-2xl p-5 md:p-7 ${sunMode ? 'bg-white border-indigo-200' : 'bg-zinc-900 border-indigo-800'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className={`w-7 h-7 ${sunMode ? 'text-indigo-600' : 'text-indigo-400'}`} />
            <div>
              <h2 className={`text-xl font-black uppercase ${sunMode ? 'text-gray-900' : 'text-white'}`}>
                Admin Dashboard
              </h2>
              <p className={`text-sm ${sunMode ? 'text-gray-500' : 'text-zinc-400'}`}>
                {users.length} {language === 'en' ? 'registered users' : language === 'ca' ? 'usuaris registrats' : 'usuarios registrados'}
              </p>
            </div>
          </div>
          <button
            onClick={loadUsers}
            disabled={loading}
            className={`p-2.5 rounded-lg border transition active:scale-95 ${sunMode ? 'border-gray-200 hover:bg-gray-50' : 'border-zinc-700 hover:bg-zinc-800'}`}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''} ${sunMode ? 'text-gray-600' : 'text-zinc-400'}`} />
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-sm font-bold mb-4">{error}</p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="space-y-3">
            {users.map(user => (
              <div key={user.id} className={`flex items-center gap-4 p-4 rounded-xl border ${sunMode ? 'border-gray-200 bg-gray-50' : 'border-zinc-700 bg-zinc-800'}`}>
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full border border-gray-300" />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${sunMode ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-950 text-indigo-400'}`}>
                    {user.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold truncate ${sunMode ? 'text-gray-900' : 'text-white'}`}>{user.name}</p>
                  <p className={`text-xs truncate ${sunMode ? 'text-gray-500' : 'text-zinc-400'}`}>{user.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-xs font-bold ${sunMode ? 'text-gray-700' : 'text-zinc-300'}`}>
                    {new Date(user.lastLogin).toLocaleDateString()}
                  </p>
                  <p className={`text-[10px] ${sunMode ? 'text-gray-400' : 'text-zinc-500'}`}>
                    {user.loginCount || 1}x logins
                  </p>
                </div>
              </div>
            ))}
            {users.length === 0 && !error && (
              <p className={`text-center py-8 text-sm ${sunMode ? 'text-gray-400' : 'text-zinc-500'}`}>
                {language === 'en' ? 'No users registered yet' : 'No hay usuarios registrados aún'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
