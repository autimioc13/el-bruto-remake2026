import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import CharacterSprite from '../components/CharacterSprite';
import RankBadge from '../components/RankBadge';

interface RankingEntry {
  id: string;
  name: string;
  level: number;
  wins: number;
  losses: number;
  appearance: { skin_color: string; hair_color: string };
  rank?: string;
  clan?: { name: string } | null;
}

export default function Ranking() {
  const [characters, setCharacters] = useState<RankingEntry[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [challenging, setChallengingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/ranking').then(({ data }) => setCharacters(data));
    api.get('/characters/me').then(({ data }) => setMyId(data.id)).catch(() => {});
  }, []);

  const handleChallenge = async (defenderId: string) => {
    setChallengingId(defenderId);
    try {
      const { data } = await api.post('/combat', { defender_id: defenderId });
      navigate(`/arena/${data.combat_id}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al iniciar combate');
      setChallengingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-amber-900">⚔ Rivales</h1>
          <button onClick={() => navigate('/profile')}
            className="px-4 py-2 bg-amber-700 text-white rounded font-bold text-sm">
            Mi Bruto
          </button>
        </div>
        <p className="text-amber-700 text-sm mb-5">Elige un rival y ¡a combatir!</p>

        {characters.length === 0 && (
          <div className="bg-amber-100 border-2 border-amber-400 rounded-lg p-8 text-center text-amber-700">
            Aún no hay más Brutos registrados. ¡Invita a alguien!
          </div>
        )}

        <div className="space-y-2">
          {characters.map((char, i) => {
            const isMe = char.id === myId;
            return (
              <div key={char.id}
                className={`bg-amber-100 border-2 rounded-lg p-3 flex items-center gap-3 transition-colors ${isMe ? 'border-amber-400 opacity-60' : 'border-amber-700 hover:bg-amber-200'}`}>
                <span className="text-lg font-bold text-amber-800 w-7">#{i + 1}</span>
                <div className="cursor-pointer" onClick={() => navigate(`/profile/${char.id}`)}>
                  <CharacterSprite
                    skinColor={char.appearance.skin_color}
                    hairColor={char.appearance.hair_color}
                    rank={char.rank ?? 'Bruto'}
                    size={36}
                  />
                </div>
                <div className="flex-1 cursor-pointer" onClick={() => navigate(`/profile/${char.id}`)}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-amber-900">{char.name}</p>
                    {char.rank && <RankBadge rank={char.rank} />}
                    {char.clan && <span className="text-xs text-amber-600 font-bold">[{char.clan.name}]</span>}
                    {isMe && <span className="text-xs text-amber-500 italic">(tú)</span>}
                  </div>
                  <p className="text-sm text-amber-700">Nv {char.level} · {char.wins}V {char.losses}D</p>
                </div>
                {!isMe && (
                  <button
                    onClick={() => handleChallenge(char.id)}
                    disabled={challenging === char.id}
                    className="px-4 py-2 bg-red-700 text-white font-bold rounded hover:bg-red-800 text-sm disabled:opacity-50 transition-colors whitespace-nowrap">
                    {challenging === char.id ? '...' : '⚔ RETAR'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
