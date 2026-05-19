import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

interface CharData {
  level: number;
  wins: number;
  losses: number;
  equipped_weapon: { rarity: string } | null;
  pet: { evolution_stage: number } | null;
  clan: { name: string } | null;
}

interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  cat: string;
  unlock: (c: CharData) => boolean;
}

const ACHIEVEMENTS: AchievementDef[] = [
  // Combate
  { id: 'first_win',   name: 'Primera Sangre',  desc: 'Gana tu primer combate',                 cat: 'combate',    unlock: c => c.wins >= 1 },
  { id: 'wins_5',      name: 'Guerrero',         desc: 'Gana 5 combates',                        cat: 'combate',    unlock: c => c.wins >= 5 },
  { id: 'wins_10',     name: 'Veterano',         desc: 'Gana 10 combates',                       cat: 'combate',    unlock: c => c.wins >= 10 },
  { id: 'wins_25',     name: 'Campeón',          desc: 'Gana 25 combates',                       cat: 'combate',    unlock: c => c.wins >= 25 },
  { id: 'wins_50',     name: 'Leyenda',          desc: 'Gana 50 combates',                       cat: 'combate',    unlock: c => c.wins >= 50 },
  { id: 'losses_10',   name: 'Resistente',       desc: 'Pierde 10 combates y sigue luchando',   cat: 'combate',    unlock: c => c.losses >= 10 },
  { id: 'total_50',    name: 'Incansable',       desc: 'Pelea 50 combates en total',             cat: 'combate',    unlock: c => c.wins + c.losses >= 50 },
  { id: 'total_100',   name: 'Gladiador Eterno', desc: 'Pelea 100 combates en total',            cat: 'combate',    unlock: c => c.wins + c.losses >= 100 },
  // Progresión
  { id: 'lvl_5',       name: 'Gladiador',        desc: 'Alcanza el nivel 5',                     cat: 'progresion', unlock: c => c.level >= 5 },
  { id: 'lvl_10',      name: 'Asesino',          desc: 'Alcanza el nivel 10',                    cat: 'progresion', unlock: c => c.level >= 10 },
  { id: 'lvl_15',      name: 'Monje',            desc: 'Alcanza el nivel 15',                    cat: 'progresion', unlock: c => c.level >= 15 },
  { id: 'lvl_20',      name: 'Berserker',        desc: 'Alcanza el nivel 20',                    cat: 'progresion', unlock: c => c.level >= 20 },
  { id: 'lvl_25',      name: 'Cazador',          desc: 'Alcanza el nivel 25 (rango máximo)',     cat: 'progresion', unlock: c => c.level >= 25 },
  // Equipamiento
  { id: 'armed',       name: 'Armado',           desc: 'Consigue tu primera arma',               cat: 'equipo',     unlock: c => !!c.equipped_weapon },
  { id: 'rare_wpn',    name: 'Coleccionista',    desc: 'Obtén un arma rara o superior',          cat: 'equipo',     unlock: c => ['rare','epic','legendary','mythic'].includes(c.equipped_weapon?.rarity ?? '') },
  { id: 'epic_wpn',    name: 'Élite',            desc: 'Obtén un arma épica o superior',         cat: 'equipo',     unlock: c => ['epic','legendary','mythic'].includes(c.equipped_weapon?.rarity ?? '') },
  { id: 'legendary_wpn', name: 'El Elegido',     desc: 'Obtén un arma legendaria o mítica',      cat: 'equipo',     unlock: c => ['legendary','mythic'].includes(c.equipped_weapon?.rarity ?? '') },
  // Mascotas
  { id: 'tamer',       name: 'Domador',          desc: 'Consigue tu primera mascota',            cat: 'mascotas',   unlock: c => !!c.pet },
  { id: 'evolved',     name: 'Maestro Domador',  desc: 'Evoluciona tu mascota al menos una vez', cat: 'mascotas',   unlock: c => (c.pet?.evolution_stage ?? 0) >= 2 },
  { id: 'max_evolved', name: 'Dios Domador',     desc: 'Lleva tu mascota al máximo de evolución',cat: 'mascotas',   unlock: c => (c.pet?.evolution_stage ?? 0) >= 4 },
  // Social
  { id: 'clan_member', name: 'Hermano de Clan',  desc: 'Únete a un clan',                        cat: 'social',     unlock: c => !!c.clan },
  // Especiales
  { id: 'undefeated',  name: 'Invicto',          desc: 'Alcanza nivel 5 sin ninguna derrota',    cat: 'especial',   unlock: c => c.level >= 5 && c.losses === 0 },
  { id: 'pacifist',    name: 'El Sufrido',       desc: 'Pierde 5 combates seguidos (son cosas)', cat: 'especial',   unlock: c => c.losses >= 5 && c.wins === 0 },
];

const CAT_LABELS: Record<string, string> = {
  combate: 'Combate', progresion: 'Progresión', equipo: 'Equipamiento',
  mascotas: 'Mascotas', social: 'Social', especial: 'Especiales',
};

const CAT_COLORS: Record<string, string> = {
  combate: '#ef4444', progresion: '#f59e0b', equipo: '#8b5cf6',
  mascotas: '#22c55e', social: '#3b82f6', especial: '#f97316',
};

const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function Achievements() {
  const [character, setCharacter] = useState<CharData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/characters/me')
      .then(({ data }) => setCharacter(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0800' }}>
      <p className="text-amber-700 text-sm animate-pulse font-bold">Cargando logros...</p>
    </div>
  );

  if (!character) return null;

  const computed = ACHIEVEMENTS.map(a => ({ ...a, unlocked: a.unlock(character) }));
  const unlockedCount = computed.filter(a => a.unlocked).length;
  const pct = Math.round((unlockedCount / ACHIEVEMENTS.length) * 100);

  const filtered = activeFilter === 'all'
    ? computed
    : activeFilter === 'unlocked'
    ? computed.filter(a => a.unlocked)
    : computed.filter(a => a.cat === activeFilter);

  const categories = ['all', 'unlocked', ...Object.keys(CAT_LABELS)];

  return (
    <div className="min-h-screen p-4 sm:p-6"
      style={{ background: 'linear-gradient(180deg, #0a0800 0%, #0c0a09 100%)' }}>
      <div className="max-w-2xl mx-auto">

        <div className="mb-8">
          <button onClick={() => navigate('/profile')}
            className="flex items-center gap-1.5 text-stone-500 hover:text-amber-400 transition-colors duration-200 text-sm"
            style={{ cursor: 'pointer' }}>
            <ArrowLeftIcon />
            Mi perfil
          </button>
        </div>

        <div className="text-center mb-8">
          <p className="text-amber-700 text-xs font-bold tracking-widest uppercase mb-2">Sala de la fama</p>
          <h1 className="font-black text-5xl" style={{ color: '#f59e0b', textShadow: '0 0 30px rgba(245,158,11,0.4)' }}>
            LOGROS
          </h1>
        </div>

        {/* Progress summary */}
        <div className="rounded-2xl p-5 mb-6"
          style={{ background: 'rgba(20,14,4,0.98)', border: '1px solid rgba(180,130,20,0.2)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#6b7280' }}>
                Desbloqueados
              </p>
              <p className="font-black text-2xl" style={{ color: '#f59e0b' }}>
                {unlockedCount}
                <span className="text-stone-500 text-base font-bold"> / {ACHIEVEMENTS.length}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="font-black text-3xl" style={{ color: pct === 100 ? '#4ade80' : '#f59e0b' }}>
                {pct}%
              </p>
            </div>
          </div>
          <div className="w-full rounded-full h-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-2.5 rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: pct === 100
                  ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                  : 'linear-gradient(90deg, #f59e0b, #d97706)',
                boxShadow: '0 0 10px rgba(245,158,11,0.3)',
              }} />
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-4">
          {categories.map(cat => {
            const isActive = activeFilter === cat;
            const label = cat === 'all' ? 'Todos'
              : cat === 'unlocked' ? `Obtenidos (${unlockedCount})`
              : CAT_LABELS[cat];
            const color = CAT_COLORS[cat] ?? '#f59e0b';

            return (
              <button key={cat} onClick={() => setActiveFilter(cat)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150"
                style={{
                  background: isActive ? `${color}25` : 'rgba(255,255,255,0.04)',
                  border: isActive ? `1px solid ${color}50` : '1px solid rgba(255,255,255,0.06)',
                  color: isActive ? color : '#6b7280',
                  cursor: 'pointer',
                }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* Achievement grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(ach => (
            <div key={ach.id}
              className="rounded-xl p-4 flex items-center gap-3 transition-all duration-200"
              style={{
                background: ach.unlocked ? 'rgba(20,14,4,0.98)' : 'rgba(10,8,2,0.7)',
                border: ach.unlocked
                  ? `1px solid ${CAT_COLORS[ach.cat] ?? '#f59e0b'}30`
                  : '1px solid rgba(255,255,255,0.04)',
                opacity: ach.unlocked ? 1 : 0.5,
              }}>

              {/* Status icon */}
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: ach.unlocked
                    ? `${CAT_COLORS[ach.cat] ?? '#f59e0b'}18`
                    : 'rgba(255,255,255,0.04)',
                  color: ach.unlocked ? (CAT_COLORS[ach.cat] ?? '#f59e0b') : '#374151',
                }}>
                {ach.unlocked ? <CheckIcon /> : <LockIcon />}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm leading-tight"
                  style={{ color: ach.unlocked ? '#e7e5e4' : '#4b5563' }}>
                  {ach.name}
                </p>
                <p className="text-xs mt-0.5 leading-snug"
                  style={{ color: ach.unlocked ? '#6b7280' : '#374151' }}>
                  {ach.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm font-bold" style={{ color: '#4b5563' }}>
              No hay logros en esta categoría todavía
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
