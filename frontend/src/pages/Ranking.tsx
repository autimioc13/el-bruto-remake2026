import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import CharacterSprite from '../components/CharacterSprite';
import BruteRenderer from '../components/BruteRenderer';
import RankBadge from '../components/RankBadge';

interface RankingEntry {
  id: string;
  name: string;
  level: number;
  wins: number;
  losses: number;
  appearance: { skin_color: string; hair_color: string; hair_style?: string; gender: 'male' | 'female'; body?: string; colors?: string };
  rank?: string;
  clan?: { name: string } | null;
}

const POSITION_STYLE: Record<number, { color: string; glow: string }> = {
  0: { color: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
  1: { color: '#9ca3af', glow: 'rgba(156,163,175,0.2)' },
  2: { color: '#b45309', glow: 'rgba(180,83,9,0.2)' },
};

export default function Ranking() {
  const [characters, setCharacters] = useState<RankingEntry[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [challengingId, setChallengingId] = useState<string | null>(null);
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
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0a0800 0%, #120e02 100%)' }}>

      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex justify-between items-center"
        style={{ background: 'rgba(10,8,0,0.95)', borderBottom: '1px solid rgba(180,130,20,0.2)', backdropFilter: 'blur(10px)' }}>
        <div>
          <h1 className="text-xl font-black text-amber-400">Rivales</h1>
          <p className="text-stone-600 text-xs">Elige un rival y ¡a combatir!</p>
        </div>
        <button onClick={() => navigate('/profile')}
          className="px-4 py-2 text-sm font-bold rounded-lg text-amber-400 transition-all hover:text-amber-300"
          style={{ background: 'rgba(180,130,20,0.15)', border: '1px solid rgba(180,130,20,0.2)' }}>
          Mi Bruto
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-2">

        {characters.length === 0 && (
          <div className="text-center py-16">
            <p className="text-stone-500 font-bold">Aún no hay más Brutos.</p>
            <p className="text-stone-600 text-sm">¡Invita a alguien a combatir!</p>
          </div>
        )}

        {characters.map((char, i) => {
          const isMe = char.id === myId;
          const pos = POSITION_STYLE[i];
          return (
            <div key={char.id}
              className="flex items-center gap-3 rounded-xl p-3 transition-all"
              style={{
                background: isMe ? 'rgba(180,130,20,0.08)' : 'rgba(28,20,4,0.9)',
                border: `1px solid ${pos ? pos.color + '40' : isMe ? 'rgba(180,130,20,0.3)' : 'rgba(255,255,255,0.05)'}`,
                boxShadow: pos ? `0 0 20px ${pos.glow}` : 'none',
              }}>

              {/* Position */}
              <div className="w-8 text-center flex-shrink-0">
                <span className="font-black text-sm"
                  style={{ color: pos?.color ?? '#4b5563' }}>
                  #{i + 1}
                </span>
              </div>

              {/* Sprite */}
              <div className="cursor-pointer flex-shrink-0" onClick={() => navigate(`/profile/${char.id}`)}>
                {char.appearance.body && char.appearance.colors ? (
                  <BruteRenderer
                    gender={char.appearance.gender}
                    body={char.appearance.body}
                    colors={char.appearance.colors}
                    size={38}
                    animate={false}
                  />
                ) : (
                  <CharacterSprite
                    skinColor={char.appearance.skin_color}
                    hairColor={char.appearance.hair_color}
                    rank={char.rank ?? 'Bruto'}
                    hairStyle={char.appearance.hair_style ?? 'short'}
                    size={38}
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/profile/${char.id}`)}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-stone-100">{char.name}</span>
                  {char.rank && <RankBadge rank={char.rank} />}
                  {char.clan && <span className="text-xs text-amber-700 font-bold">[{char.clan.name}]</span>}
                  {isMe && <span className="text-xs text-amber-800 italic">(tú)</span>}
                </div>
                <p className="text-xs text-stone-500 mt-0.5">Nv {char.level} · {char.wins}V {char.losses}D</p>
              </div>

              {/* Challenge */}
              {!isMe && (
                <button onClick={() => handleChallenge(char.id)}
                  disabled={challengingId === char.id}
                  className="flex-shrink-0 px-4 py-2 font-black text-sm rounded-lg text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
                  style={{
                    background: challengingId === char.id ? '#7f1d1d' : 'linear-gradient(135deg,#991b1b,#7f1d1d)',
                    boxShadow: '0 4px 16px rgba(153,27,27,0.4)',
                    cursor: challengingId === char.id ? 'not-allowed' : 'pointer',
                  }}>
                  {challengingId === char.id ? '...' : 'RETAR'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
