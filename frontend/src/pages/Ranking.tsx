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
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/ranking').then(({ data }) => setCharacters(data));
  }, []);

  return (
    <div className="min-h-screen bg-amber-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-amber-900">Ranking de Brutos</h1>
          <div className="flex gap-2">
            <button onClick={() => navigate('/clans')} className="px-3 py-2 bg-amber-700 text-white rounded font-bold text-sm">Clanes</button>
            <button onClick={() => navigate('/profile')} className="px-3 py-2 bg-amber-700 text-white rounded font-bold text-sm">Mi Bruto</button>
          </div>
        </div>

        <div className="space-y-2">
          {characters.map((char, i) => (
            <div key={char.id} onClick={() => navigate(`/profile/${char.id}`)}
              className="bg-amber-100 border-2 border-amber-700 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-amber-200 transition-colors">
              <span className="text-xl font-bold text-amber-800 w-8">#{i + 1}</span>
              <CharacterSprite
                skinColor={char.appearance.skin_color}
                hairColor={char.appearance.hair_color}
                rank={char.rank ?? 'Bruto'}
                size={32}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-amber-900">{char.name}</p>
                  {char.rank && <RankBadge rank={char.rank} />}
                  {char.clan && <span className="text-xs text-amber-600 font-bold">[{char.clan.name}]</span>}
                </div>
                <p className="text-sm text-amber-700">Nivel {char.level} · {char.wins}V {char.losses}D</p>
              </div>
              <span className="text-amber-600 text-sm">Ver →</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
