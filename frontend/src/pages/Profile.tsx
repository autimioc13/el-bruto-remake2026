import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import type { Character } from '../types';
import StatBar from '../components/StatBar';
import CharacterSprite from '../components/CharacterSprite';
import BruteRenderer from '../components/BruteRenderer';
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

const RARITY_GLOW: Record<string, string> = {
  common: '#9e9e9e', rare: '#2196f3', epic: '#9c27b0', legendary: '#ff9800', mythic: '#f44336',
};

const CATEGORY_BADGE: Record<string, string> = {
  pasiva: '#78350f', aumentador: '#1e3a5f', super: '#4a1942', talento: '#064e3b',
};

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
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: '#0a0800' }}>
      <div className="text-amber-500 text-xl font-bold animate-pulse">Cargando...</div>
    </div>
  );

  if (!character) return null;
  const isOwnProfile = !id;
  const xpPct = Math.min(100, (character.xp / character.xp_to_next_level) * 100);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0a0800 0%, #120e02 100%)' }}>

      {/* Top nav */}
      <div className="sticky top-0 z-10 px-4 py-3 flex justify-between items-center"
        style={{ background: 'rgba(10,8,0,0.95)', borderBottom: '1px solid rgba(180,130,20,0.2)', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center gap-3">
          <span className="text-xl font-black text-amber-400">{character.name}</span>
          <RankBadge rank={character.rank} />
          {character.clan && <span className="text-xs text-amber-700 font-bold">[{character.clan.name}]</span>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/clans')}
            className="px-3 py-1.5 text-xs font-bold rounded-lg text-amber-400 transition-all hover:text-amber-300"
            style={{ background: 'rgba(180,130,20,0.15)', border: '1px solid rgba(180,130,20,0.2)' }}>
            Clanes
          </button>
          <button onClick={() => navigate('/ranking')}
            className="px-3 py-1.5 text-xs font-bold rounded-lg text-amber-400 transition-all hover:text-amber-300"
            style={{ background: 'rgba(180,130,20,0.15)', border: '1px solid rgba(180,130,20,0.2)' }}>
            Ranking
          </button>
          {isOwnProfile && (
            <button onClick={() => { localStorage.removeItem('session'); navigate('/'); }}
              className="px-3 py-1.5 text-xs font-bold rounded-lg text-stone-400 hover:text-stone-300 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              Salir
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* Fight CTA */}
        {isOwnProfile && (
          <button onClick={() => navigate('/ranking')}
            className="w-full py-5 font-black text-white text-2xl rounded-xl transition-all hover:opacity-90 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #991b1b, #7f1d1d)',
              boxShadow: '0 8px 30px rgba(153,27,27,0.5)',
              border: '1px solid rgba(220,38,38,0.3)',
            }}>
            BUSCAR RIVALES
          </button>
        )}

        {/* Character hero card */}
        <div className="rounded-2xl p-5 flex items-center gap-5"
          style={{ background: 'rgba(28,20,4,0.9)', border: '1px solid rgba(180,130,20,0.25)' }}>
          {/* Sprite frame */}
          <div className="relative flex-shrink-0">
            <div className="rounded-xl p-3 flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.5)', border: '2px solid rgba(180,130,20,0.4)', minWidth: 90 }}>
              {character.appearance.body && character.appearance.colors ? (
                <BruteRenderer
                  gender={character.appearance.gender}
                  body={character.appearance.body}
                  colors={character.appearance.colors}
                  size={72}
                  animate
                />
              ) : (
                <CharacterSprite
                  skinColor={character.appearance.skin_color}
                  hairColor={character.appearance.hair_color}
                  rank={character.rank}
                  hairStyle={character.appearance.hair_style}
                  size={72}
                />
              )}
            </div>
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-black text-amber-400">Nivel {character.level}</span>
            </div>
            <p className="text-stone-500 text-sm mb-3">
              {character.wins} victorias · {character.losses} derrotas
            </p>
            {/* XP Bar */}
            <div className="w-full rounded-full h-2.5 mb-1"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${xpPct}%`, background: 'linear-gradient(90deg,#f59e0b,#d97706)', boxShadow: '0 0 10px rgba(245,158,11,0.4)' }} />
            </div>
            <p className="text-xs text-stone-600">{character.xp} / {character.xp_to_next_level} XP</p>
          </div>
        </div>

        {/* Stats + Equipment */}
        <div className="grid grid-cols-2 gap-4">
          {/* Stats */}
          <div className="rounded-xl p-4"
            style={{ background: 'rgba(28,20,4,0.9)', border: '1px solid rgba(180,130,20,0.2)' }}>
            <h2 className="text-sm font-black text-amber-600 uppercase tracking-widest mb-4">Estadísticas</h2>
            <StatBar label="Vida" value={character.stats.hp} max={300} />
            <StatBar label="Fuerza" value={character.stats.strength} max={50} />
            <StatBar label="Agilidad" value={character.stats.agility} max={50} />
            <StatBar label="Resistencia" value={character.stats.endurance} max={50} />
          </div>

          {/* Equipment */}
          <div className="rounded-xl p-4"
            style={{ background: 'rgba(28,20,4,0.9)', border: '1px solid rgba(180,130,20,0.2)' }}>
            <h2 className="text-sm font-black text-amber-600 uppercase tracking-widest mb-4">Equipamiento</h2>

            {character.equipped_weapon ? (
              <div className="flex items-center gap-3 mb-4 p-2 rounded-lg"
                style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${RARITY_GLOW[character.equipped_weapon.rarity] ?? '#9e9e9e'}40` }}>
                <WeaponIcon weaponType={character.equipped_weapon.weapon_type} rarity={character.equipped_weapon.rarity} size={36} />
                <div>
                  <p className="font-bold text-stone-200 text-sm leading-tight">{character.equipped_weapon.name}</p>
                  <p className="text-xs font-bold capitalize" style={{ color: RARITY_GLOW[character.equipped_weapon.rarity] }}>
                    {character.equipped_weapon.rarity}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-2 rounded-lg text-center"
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <p className="text-stone-600 text-sm">Sin arma</p>
              </div>
            )}

            {character.pet ? (
              <div className="flex items-center gap-3 p-2 rounded-lg"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(34,197,94,0.15)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/>
                  <circle cx="4" cy="8" r="2"/><circle cx="4" cy="16" r="2"/>
                  <path d="M11.5 12c-1.4-2-2.5-3-4-3-2.5 0-4 2-4 4 0 3.5 4 7 8.5 7s8.5-3.5 8.5-7c0-2-1.5-4-4-4-1.5 0-2.6 1-4 3z"/>
                </svg>
              </div>
                <div>
                  <p className="font-bold text-stone-200 text-sm leading-tight">{character.pet.name}</p>
                  <p className="text-xs text-stone-500">Evolución {character.pet.evolution_stage}</p>
                </div>
              </div>
            ) : (
              <div className="p-2 rounded-lg text-center"
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <p className="text-stone-600 text-sm">Sin mascota</p>
              </div>
            )}
          </div>
        </div>

        {/* Skills */}
        {character.character_skills && character.character_skills.length > 0 && (
          <div className="rounded-xl p-4"
            style={{ background: 'rgba(28,20,4,0.9)', border: '1px solid rgba(180,130,20,0.2)' }}>
            <h2 className="text-sm font-black text-amber-600 uppercase tracking-widest mb-3">Habilidades</h2>
            <div className="flex flex-wrap gap-2">
              {character.character_skills.map((entry) => entry.skills && (
                <div key={entry.skill_id}
                  title={entry.skills.description}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-stone-200 cursor-default"
                  style={{ background: CATEGORY_BADGE[entry.skills.category ?? 'pasiva'] ?? '#292524', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {entry.skills.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Challenge button */}
        {!isOwnProfile && (
          <button onClick={handleChallenge}
            className="w-full py-5 font-black text-white text-xl rounded-xl transition-all hover:opacity-90 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #991b1b, #7f1d1d)',
              boxShadow: '0 8px 30px rgba(153,27,27,0.5)',
              border: '1px solid rgba(220,38,38,0.3)',
            }}>
            RETAR A {character.name.toUpperCase()}
          </button>
        )}
      </div>
    </div>
  );
}
