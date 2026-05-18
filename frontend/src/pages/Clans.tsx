import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

interface Clan {
  id: string;
  name: string;
  description: string;
  total_wins: number;
  clan_members: { count: number }[];
}

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const SwordIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/>
    <line x1="13" y1="19" x2="19" y2="13"/>
    <line x1="16" y1="16" x2="20" y2="20"/>
    <line x1="19" y1="21" x2="21" y2="19"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

const rankMedals: Record<number, string> = { 1: '#f59e0b', 2: '#9ca3af', 3: '#b45309' };

export default function Clans() {
  const [clans, setClans] = useState<Clan[]>([]);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const load = () =>
    api.get('/clans').then(({ data }) => setClans(data)).catch(() => {});

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      await api.post('/clans', { name: newName, description: newDesc });
      setSuccess('¡Clan fundado!');
      setMode('list');
      setNewName(''); setNewDesc('');
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear clan');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (clanId: string) => {
    setError(''); setSuccess('');
    try {
      await api.post(`/clans/${clanId}/join`);
      setSuccess('¡Te uniste al clan!');
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al unirse');
    }
  };

  const handleLeave = async () => {
    setError(''); setSuccess('');
    try {
      await api.post('/clans/leave');
      setSuccess('Saliste del clan');
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al salir');
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6"
      style={{ background: 'linear-gradient(180deg, #0a0800 0%, #0c0a09 100%)' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/profile')}
              className="flex items-center gap-1.5 text-stone-500 hover:text-amber-400 transition-colors duration-200 text-sm"
              style={{ cursor: 'pointer' }}>
              <ArrowLeftIcon />
              Mi perfil
            </button>
          </div>
          <button
            onClick={() => { setMode(mode === 'create' ? 'list' : 'create'); setError(''); setSuccess(''); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{
              background: mode === 'create' ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #d97706, #b45309)',
              color: mode === 'create' ? '#9ca3af' : '#0c0a09',
              border: mode === 'create' ? '1px solid rgba(255,255,255,0.1)' : 'none',
              cursor: 'pointer',
            }}>
            {mode === 'create' ? 'Ver lista' : <><PlusIcon /><span>Fundar clan</span></>}
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <p className="text-amber-700 text-xs font-bold tracking-widest uppercase mb-2">Hermandades de combate</p>
          <h1 className="font-black text-5xl" style={{ color: '#f59e0b', textShadow: '0 0 30px rgba(245,158,11,0.4)' }}>
            CLANES
          </h1>
        </div>

        {/* Feedback */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm font-bold"
            style={{ background: 'rgba(153,27,27,0.2)', border: '1px solid rgba(153,27,27,0.4)', color: '#fca5a5' }}>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm font-bold"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac' }}>
            {success}
          </div>
        )}

        {/* Create form */}
        {mode === 'create' && (
          <div className="rounded-2xl p-6 mb-6"
            style={{ background: 'rgba(20,14,4,0.98)', border: '1px solid rgba(180,130,20,0.25)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
            <div className="flex items-center gap-2 mb-5">
              <span style={{ color: '#f59e0b' }}><ShieldIcon /></span>
              <h2 className="font-black text-lg" style={{ color: '#f59e0b' }}>Nuevo Clan</h2>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#6b7280' }}>
                  Nombre del clan
                </label>
                <input
                  value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="Ej: Los Inmortales" maxLength={50} required
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(180,130,20,0.2)',
                    color: '#e7e5e4',
                    outline: 'none',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(245,158,11,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(180,130,20,0.2)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#6b7280' }}>
                  Descripción <span style={{ color: '#4b5563' }}>(opcional)</span>
                </label>
                <input
                  value={newDesc} onChange={e => setNewDesc(e.target.value)}
                  placeholder="La historia de tu clan..."
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(180,130,20,0.2)',
                    color: '#e7e5e4',
                    outline: 'none',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(245,158,11,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(180,130,20,0.2)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-black text-sm transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#0c0a09',
                  boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}>
                {loading ? 'Fundando...' : '¡Fundar clan!'}
              </button>
            </form>
          </div>
        )}

        {/* Clan list */}
        <div className="space-y-3">
          {clans.map((clan, i) => {
            const rank = i + 1;
            const medalColor = rankMedals[rank];
            const members = clan.clan_members?.[0]?.count ?? 0;

            return (
              <div key={clan.id}
                className="rounded-2xl p-4 transition-all duration-200"
                style={{
                  background: 'rgba(20,14,4,0.97)',
                  border: rank <= 3
                    ? `1px solid ${medalColor}40`
                    : '1px solid rgba(180,130,20,0.15)',
                  boxShadow: rank === 1 ? '0 0 20px rgba(245,158,11,0.08)' : 'none',
                }}>
                <div className="flex items-center gap-4">

                  {/* Rank badge */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                    style={{
                      background: medalColor ? `${medalColor}18` : 'rgba(255,255,255,0.04)',
                      color: medalColor ?? '#4b5563',
                      border: `1px solid ${medalColor ? medalColor + '30' : 'rgba(255,255,255,0.08)'}`,
                    }}>
                    #{rank}
                  </div>

                  {/* Clan info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-black truncate" style={{ color: rank === 1 ? '#f59e0b' : '#e7e5e4' }}>
                        {clan.name}
                      </span>
                    </div>
                    {clan.description && (
                      <p className="text-xs truncate mb-1" style={{ color: '#6b7280' }}>{clan.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs" style={{ color: '#4b5563' }}>
                      <span className="flex items-center gap-1">
                        <UsersIcon />{members} miembro{members !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <SwordIcon />{clan.total_wins} victorias
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleJoin(clan.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 hover:opacity-90 active:scale-95"
                      style={{
                        background: 'linear-gradient(135deg, #d97706, #b45309)',
                        color: '#0c0a09',
                        cursor: 'pointer',
                      }}>
                      Unirse
                    </button>
                    <button onClick={handleLeave}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 hover:opacity-80 active:scale-95"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        color: '#6b7280',
                        border: '1px solid rgba(255,255,255,0.08)',
                        cursor: 'pointer',
                      }}>
                      Salir
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {clans.length === 0 && (
            <div className="text-center py-16">
              <div className="mb-3" style={{ color: '#374151' }}>
                <ShieldIcon />
              </div>
              <p className="font-bold text-sm" style={{ color: '#4b5563' }}>
                No hay clanes todavía
              </p>
              <p className="text-xs mt-1" style={{ color: '#374151' }}>
                ¡Funda el primero y lidera la hermandad!
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
