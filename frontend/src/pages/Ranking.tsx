import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Character } from '../types';

export default function Ranking() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/ranking').then(({ data }) => setCharacters(data));
  }, []);

  return (
    <div className="min-h-screen bg-amber-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-amber-900">Ranking de Brutos</h1>
          <button onClick={() => navigate('/profile')}
            className="px-4 py-2 bg-amber-700 text-white rounded font-bold">
            Mi Bruto
          </button>
        </div>

        <div className="space-y-2">
          {characters.map((char, i) => (
            <div key={char.id} onClick={() => navigate(`/profile/${char.id}`)}
              className="bg-amber-100 border-2 border-amber-700 rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:bg-amber-200 transition-colors">
              <span className="text-2xl font-bold text-amber-800 w-10">#{i + 1}</span>
              <div className="w-10 h-10 rounded-full border-2 border-amber-700"
                style={{ background: char.appearance.skin_color }} />
              <div className="flex-1">
                <p className="font-bold text-amber-900">{char.name}</p>
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
