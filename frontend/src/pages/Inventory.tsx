import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import WeaponIcon from '../components/WeaponIcon';
import { RARITY_COLORS } from '../sprites/weapons';

interface WeaponEntry {
  id: string;
  equipped: boolean;
  unlocked_at: string;
  weapons: {
    id: string;
    name: string;
    weapon_type: string;
    rarity: string;
    min_level: number;
    effect: any;
  };
}

const RARITY_LABEL: Record<string, string> = {
  common: 'Común', rare: 'Raro', epic: 'Épico', legendary: 'Legendario', mythic: 'Mítico',
};

const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

const SwordIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/>
    <line x1="13" y1="19" x2="19" y2="13"/>
    <line x1="16" y1="16" x2="20" y2="20"/>
    <line x1="19" y1="21" x2="21" y2="19"/>
  </svg>
);

export default function Inventory() {
  const [weapons, setWeapons] = useState<WeaponEntry[]>([]);
  const [equipping, setEquipping] = useState<string | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = () =>
    api.get('/weapons/mine').then(({ data }) => setWeapons(data)).catch(() => {});

  useEffect(() => { load(); }, []);

  const handleEquip = async (weaponId: string) => {
    setEquipping(weaponId);
    setError('');
    try {
      await api.post('/weapons/equip', { weapon_id: weaponId });
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al equipar');
    } finally {
      setEquipping(null);
    }
  };

  const equipped = weapons.find(w => w.equipped);
  const rest = weapons.filter(w => !w.equipped);

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
          <p className="text-amber-700 text-xs font-bold tracking-widest uppercase mb-2">Arsenal del guerrero</p>
          <h1 className="font-black text-5xl" style={{ color: '#f59e0b', textShadow: '0 0 30px rgba(245,158,11,0.4)' }}>
            INVENTARIO
          </h1>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm font-bold"
            style={{ background: 'rgba(153,27,27,0.2)', border: '1px solid rgba(153,27,27,0.4)', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        {/* Equipped weapon */}
        {equipped && (
          <div className="rounded-2xl p-5 mb-6"
            style={{
              background: 'rgba(20,14,4,0.98)',
              border: `1px solid ${RARITY_COLORS[equipped.weapons.rarity]}50`,
              boxShadow: `0 0 30px ${RARITY_COLORS[equipped.weapons.rarity]}12`,
            }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#6b7280' }}>Arma equipada</p>
            <div className="flex items-center gap-4">
              <WeaponIcon weaponType={equipped.weapons.weapon_type} rarity={equipped.weapons.rarity} size={52} />
              <div className="flex-1">
                <p className="font-black text-xl" style={{ color: RARITY_COLORS[equipped.weapons.rarity] }}>
                  {equipped.weapons.name}
                </p>
                <p className="text-xs text-stone-500 mt-0.5">
                  {RARITY_LABEL[equipped.weapons.rarity] ?? equipped.weapons.rarity} · Nv {equipped.weapons.min_level}+
                </p>
                {equipped.weapons.effect?.description && (
                  <p className="text-xs text-stone-400 mt-2 leading-relaxed">{equipped.weapons.effect.description}</p>
                )}
              </div>
              <div className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' }}>
                Equipada
              </div>
            </div>
          </div>
        )}

        {/* Rest of inventory */}
        {rest.length > 0 && (
          <>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#4b5563' }}>En el baúl</p>
            <div className="space-y-3">
              {rest.map(entry => (
                <div key={entry.id}
                  className="rounded-xl p-4 flex items-center gap-4 transition-all duration-200"
                  style={{
                    background: 'rgba(20,14,4,0.97)',
                    border: `1px solid ${RARITY_COLORS[entry.weapons.rarity]}20`,
                  }}>
                  <WeaponIcon weaponType={entry.weapons.weapon_type} rarity={entry.weapons.rarity} size={44} />
                  <div className="flex-1 min-w-0">
                    <p className="font-black" style={{ color: RARITY_COLORS[entry.weapons.rarity] }}>
                      {entry.weapons.name}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {RARITY_LABEL[entry.weapons.rarity] ?? entry.weapons.rarity} · Nv {entry.weapons.min_level}+
                    </p>
                    {entry.weapons.effect?.description && (
                      <p className="text-xs text-stone-600 mt-1 truncate">{entry.weapons.effect.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleEquip(entry.weapons.id)}
                    disabled={!!equipping}
                    className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-black transition-all duration-150 hover:opacity-90 active:scale-95 disabled:opacity-40"
                    style={{
                      background: 'linear-gradient(135deg, #d97706, #b45309)',
                      color: '#0c0a09',
                      cursor: equipping ? 'not-allowed' : 'pointer',
                    }}>
                    {equipping === entry.weapons.id ? '...' : 'Equipar'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {weapons.length === 0 && (
          <div className="text-center py-20">
            <div className="flex justify-center mb-4" style={{ color: '#374151' }}>
              <SwordIcon />
            </div>
            <p className="font-bold text-sm" style={{ color: '#4b5563' }}>Sin armas todavía</p>
            <p className="text-xs mt-1" style={{ color: '#374151' }}>¡Gana combates para desbloquear tu arsenal!</p>
            <button onClick={() => navigate('/ranking')}
              className="mt-6 px-6 py-3 rounded-xl font-black text-sm transition-all hover:opacity-90 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #991b1b, #7f1d1d)',
                color: 'white',
                boxShadow: '0 4px 16px rgba(153,27,27,0.4)',
                cursor: 'pointer',
              }}>
              Ir a combatir
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
