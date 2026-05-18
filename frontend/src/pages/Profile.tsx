import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import type { Character } from '../types';
import StatBar from '../components/StatBar';
import CharacterSprite from '../components/CharacterSprite';
import RankBadge from '../components/RankBadge';
import WeaponIcon from '../components/WeaponIcon';

interface SkillEntry {
  skill_id: string;
  skills: { id: string; name: string; description: string; category?: string } | null;
}

interface EnrichedCharacter extends Character {
  rank: string;
  equipped_weapon: { name: string; weapon_type: string; rarity: string; effect: any } | null;
  pet: { name: string; pet_type: string; evolution_stage: number; effect: any } | null;
  clan: { id: string; name: string } | null;
  character_skills?: SkillEntry[];
}

export default function Profile() {
  const { id } = useParams();
  const [character, setCharacter] = useState<EnrichedCharacter | null>(null);
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

  if (loading) return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center text-amber-800 text-xl">
      Cargando...
    </div>
  );

  if (!character) return null;
  const isOwnProfile = !id;

  return (
    <div className="min-h-screen bg-amber-50 p-6">
      <div className="max-w-2xl mx-auto">

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-amber-900">{character.name}</h1>
            <RankBadge rank={character.rank} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/clans')} className="px-3 py-2 bg-amber-700 text-white rounded font-bold text-sm">Clanes</button>
            <button onClick={() => navigate('/ranking')} className="px-3 py-2 bg-amber-700 text-white rounded font-bold text-sm">Ranking</button>
            {isOwnProfile && (
              <button onClick={() => { localStorage.removeItem('session'); navigate('/'); }}
                className="px-3 py-2 bg-gray-600 text-white rounded font-bold text-sm">
                Salir
              </button>
            )}
          </div>
        </div>

        <div className="bg-amber-100 border-2 border-amber-700 rounded-lg p-5 mb-4">
          <div className="flex items-center gap-5">
            <CharacterSprite
              skinColor={character.appearance.skin_color}
              hairColor={character.appearance.hair_color}
              rank={character.rank}
              size={60}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-2xl font-bold text-amber-900">Nivel {character.level}</p>
                {character.clan && (
                  <span className="text-sm text-amber-600 font-bold">[{character.clan.name}]</span>
                )}
              </div>
              <p className="text-amber-700 text-sm">{character.wins} victorias · {character.losses} derrotas</p>
              <div className="mt-2 w-full bg-amber-200 rounded h-2">
                <div className="bg-green-600 h-2 rounded transition-all"
                  style={{ width: `${Math.min(100, (character.xp / character.xp_to_next_level) * 100)}%` }} />
              </div>
              <p className="text-xs text-amber-600 mt-1">{character.xp} / {character.xp_to_next_level} XP</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-amber-100 border-2 border-amber-700 rounded-lg p-4">
            <h2 className="text-lg font-bold text-amber-900 mb-3">Estadísticas</h2>
            <StatBar label="Vida" value={character.stats.hp} max={300} />
            <StatBar label="Fuerza" value={character.stats.strength} max={50} />
            <StatBar label="Agilidad" value={character.stats.agility} max={50} />
            <StatBar label="Resistencia" value={character.stats.endurance} max={50} />
          </div>

          <div className="bg-amber-100 border-2 border-amber-700 rounded-lg p-4">
            <h2 className="text-lg font-bold text-amber-900 mb-3">Equipamiento</h2>
            {character.equipped_weapon ? (
              <div className="flex items-center gap-2 mb-3">
                <WeaponIcon weaponType={character.equipped_weapon.weapon_type} rarity={character.equipped_weapon.rarity} size={32} />
                <div>
                  <p className="font-bold text-amber-900 text-sm">{character.equipped_weapon.name}</p>
                  <p className="text-xs capitalize" style={{ color: character.equipped_weapon.rarity === 'mythic' ? '#F44336' : character.equipped_weapon.rarity === 'legendary' ? '#FF9800' : '#9E9E9E' }}>
                    {character.equipped_weapon.rarity}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-amber-600 text-sm mb-3">Sin arma equipada</p>
            )}

            {character.pet ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center text-lg">🐾</div>
                <div>
                  <p className="font-bold text-amber-900 text-sm">{character.pet.name}</p>
                  <p className="text-xs text-amber-600">Evolución {character.pet.evolution_stage}</p>
                </div>
              </div>
            ) : (
              <p className="text-amber-600 text-sm">Sin mascota</p>
            )}
          </div>
        </div>

        {character.character_skills && character.character_skills.length > 0 && (
          <div className="bg-amber-100 border-2 border-amber-700 rounded-lg p-4 mb-4">
            <h2 className="text-lg font-bold text-amber-900 mb-3">Habilidades</h2>
            <div className="flex flex-wrap gap-2">
              {character.character_skills.map((entry) => entry.skills && (
                <div key={entry.skill_id}
                  className="bg-amber-200 border border-amber-600 rounded px-2 py-1"
                  title={entry.skills.description}>
                  <span className="text-amber-900 text-sm font-semibold">{entry.skills.name}</span>
                  {entry.skills.category && (
                    <span className="ml-1 text-xs text-amber-600">({entry.skills.category})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!isOwnProfile && (
          <button onClick={handleChallenge}
            className="w-full py-4 bg-red-700 text-white font-bold text-xl rounded hover:bg-red-800">
            ¡RETAR A {character.name.toUpperCase()}!
          </button>
        )}
      </div>
    </div>
  );
}
