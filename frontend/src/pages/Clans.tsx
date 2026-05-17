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

export default function Clans() {
  const [clans, setClans] = useState<Clan[]>([]);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const load = () =>
    api.get('/clans').then(({ data }) => setClans(data)).catch(() => {});

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/clans', { name: newName, description: newDesc });
      setSuccess('¡Clan creado!');
      setMode('list');
      setNewName(''); setNewDesc('');
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear clan');
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
    try {
      await api.post('/clans/leave');
      setSuccess('Saliste del clan');
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al salir');
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-amber-900">Clanes</h1>
          <div className="flex gap-2">
            <button onClick={() => setMode(mode === 'create' ? 'list' : 'create')}
              className="px-4 py-2 bg-amber-700 text-white rounded font-bold text-sm">
              {mode === 'create' ? 'Ver lista' : 'Crear clan'}
            </button>
            <button onClick={() => navigate('/profile')}
              className="px-4 py-2 bg-gray-600 text-white rounded font-bold text-sm">
              Mi perfil
            </button>
          </div>
        </div>

        {error && <p className="text-red-600 mb-3 font-bold">{error}</p>}
        {success && <p className="text-green-700 mb-3 font-bold">{success}</p>}

        {mode === 'create' && (
          <div className="bg-amber-100 border-2 border-amber-700 rounded-lg p-5 mb-6">
            <h2 className="text-xl font-bold text-amber-900 mb-4">Nuevo Clan</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Nombre del clan" maxLength={50} required
                className="w-full p-2 border-2 border-amber-700 rounded bg-amber-50"
              />
              <input
                value={newDesc} onChange={e => setNewDesc(e.target.value)}
                placeholder="Descripción (opcional)"
                className="w-full p-2 border-2 border-amber-700 rounded bg-amber-50"
              />
              <button type="submit"
                className="w-full py-2 bg-amber-800 text-white font-bold rounded hover:bg-amber-900">
                ¡Fundar clan!
              </button>
            </form>
          </div>
        )}

        <div className="space-y-3">
          {clans.map((clan, i) => (
            <div key={clan.id} className="bg-amber-100 border-2 border-amber-700 rounded-lg p-4 flex items-center gap-4">
              <span className="text-2xl font-bold text-amber-800 w-8">#{i + 1}</span>
              <div className="flex-1">
                <p className="font-bold text-amber-900">{clan.name}</p>
                {clan.description && <p className="text-xs text-amber-600">{clan.description}</p>}
                <p className="text-sm text-amber-700">
                  {clan.clan_members?.[0]?.count ?? 0} miembros · {clan.total_wins} victorias
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleJoin(clan.id)}
                  className="px-3 py-1 bg-amber-700 text-white rounded text-sm font-bold hover:bg-amber-800">
                  Unirse
                </button>
                <button onClick={handleLeave}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm font-bold hover:bg-gray-600">
                  Salir
                </button>
              </div>
            </div>
          ))}
          {clans.length === 0 && (
            <p className="text-center text-amber-700 py-8">No hay clanes todavía. ¡Crea el primero!</p>
          )}
        </div>
      </div>
    </div>
  );
}
