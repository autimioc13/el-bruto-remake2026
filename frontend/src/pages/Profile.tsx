import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import type { Character } from '../types';
import StatBar from '../components/StatBar';

export default function Profile() {
  const { id } = useParams();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const endpoint = id ? `/characters/${id}` : '/characters/me';
    api.get(endpoint)
      .then(({ data }) => setCharacter(data))
      .catch(() => { if (!id) navigate('/create-character'); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleChallenge = async () => {
    if (!character) return;
    try {
      const { data } = await api.post('/combat', { defender_id: character.id });
      navigate(`/arena/${data.combat_id}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al iniciar combate');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center text-amber-800 text-xl">
        Cargando...
      </div>
    );
  }

  if (!character) return null;

  const isOwnProfile = !id;

  return (
    <div className="min-h-screen bg-amber-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-amber-900">{character.name}</h1>
          <div className="flex gap-2">
            <button onClick={() => navigate('/ranking')}
              className="px-4 py-2 bg-amber-700 text-white rounded font-bold">
              Ranking
            </button>
            {isOwnProfile && (
              <button onClick={() => { localStorage.removeItem('session'); navigate('/'); }}
                className="px-4 py-2 bg-gray-600 text-white rounded font-bold">
                Salir
              </button>
            )}
          </div>
        </div>

        <div className="bg-amber-100 border-2 border-amber-700 rounded-lg p-6 mb-4">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full border-4 border-amber-800"
              style={{ background: character.appearance.skin_color }} />
            <div className="flex-1">
              <p className="text-2xl font-bold text-amber-900">Nivel {character.level}</p>
              <p className="text-amber-700">{character.wins} victorias · {character.losses} derrotas</p>
              <div className="mt-2 w-full bg-amber-200 rounded h-2">
                <div className="bg-green-600 h-2 rounded"
                  style={{ width: `${Math.min(100, (character.xp / character.xp_to_next_level) * 100)}%` }} />
              </div>
              <p className="text-xs text-amber-600 mt-1">{character.xp} / {character.xp_to_next_level} XP</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-100 border-2 border-amber-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-amber-900 mb-4">Estadísticas</h2>
          <StatBar label="Vida" value={character.stats.hp} max={300} />
          <StatBar label="Fuerza" value={character.stats.strength} max={50} />
          <StatBar label="Agilidad" value={character.stats.agility} max={50} />
          <StatBar label="Resistencia" value={character.stats.endurance} max={50} />
        </div>

        {!isOwnProfile && (
          <button onClick={handleChallenge}
            className="mt-6 w-full py-4 bg-red-700 text-white font-bold text-xl rounded hover:bg-red-800">
            ¡RETAR A {character.name.toUpperCase()}!
          </button>
        )}
      </div>
    </div>
  );
}
