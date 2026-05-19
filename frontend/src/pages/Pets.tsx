import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { PET_SVGS, PET_STAGE_TINTS } from '../sprites/pets';

interface Pet {
  id: string;
  name: string;
  pet_type: string;
  min_level: number;
  evolution_stage: number;
  effect: any;
}

interface MyPet {
  unlocked_at: string;
  pets: Pet;
}

const STAGE_LABELS = ['Normal', 'Azul', 'Morado', 'Dorado'];

const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

const PawIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/>
    <circle cx="4" cy="8" r="2"/><circle cx="4" cy="16" r="2"/>
    <path d="M11.5 12c-1.4-2-2.5-3-4-3-2.5 0-4 2-4 4 0 3.5 4 7 8.5 7s8.5-3.5 8.5-7c0-2-1.5-4-4-4-1.5 0-2.6 1-4 3z"/>
  </svg>
);

function PetDisplay({ petType, stage = 0, size = 50 }: { petType: string; stage?: number; size?: number }) {
  const svg = PET_SVGS[petType];
  if (!svg) return <div style={{ width: size, height: size }} />;
  const tint = PET_STAGE_TINTS[stage] ?? '#FFFFFF';
  const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  return (
    <img
      src={dataUrl}
      width={size}
      height={size}
      alt={petType}
      style={{ filter: tint !== '#FFFFFF' ? `drop-shadow(0 0 8px ${tint}99)` : undefined }}
    />
  );
}

const STAGE_COLORS = ['#9ca3af', '#60a5fa', '#c084fc', '#fbbf24'];

export default function Pets() {
  const [myPet, setMyPet] = useState<MyPet | null>(null);
  const [allPets, setAllPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/pets').then(({ data }) => setAllPets(data)).catch(() => {}),
      api.get('/pets/mine').then(({ data }) => setMyPet(data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const ownedId = myPet?.pets?.id;

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
          <p className="text-amber-700 text-xs font-bold tracking-widest uppercase mb-2">Compañeros de batalla</p>
          <h1 className="font-black text-5xl" style={{ color: '#f59e0b', textShadow: '0 0 30px rgba(245,158,11,0.4)' }}>
            MASCOTAS
          </h1>
        </div>

        {loading && (
          <div className="text-center py-12">
            <p className="text-amber-700 text-sm animate-pulse font-bold">Cargando...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* Active pet */}
            {myPet?.pets ? (
              <div className="rounded-2xl p-6 mb-8"
                style={{
                  background: 'rgba(20,14,4,0.98)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  boxShadow: '0 0 30px rgba(34,197,94,0.07)',
                }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#6b7280' }}>Mi mascota</p>
                <div className="flex items-center gap-5">
                  <div className="rounded-2xl p-3 flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <PetDisplay petType={myPet.pets.pet_type} stage={myPet.pets.evolution_stage} size={64} />
                  </div>
                  <div>
                    <p className="font-black text-2xl text-stone-100">{myPet.pets.name}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold"
                        style={{
                          background: `${STAGE_COLORS[myPet.pets.evolution_stage]}18`,
                          border: `1px solid ${STAGE_COLORS[myPet.pets.evolution_stage]}40`,
                          color: STAGE_COLORS[myPet.pets.evolution_stage],
                        }}>
                        Evolución {myPet.pets.evolution_stage + 1} · {STAGE_LABELS[myPet.pets.evolution_stage] ?? 'Desconocido'}
                      </span>
                    </div>
                    {myPet.pets.effect?.description && (
                      <p className="text-xs text-stone-400 mt-2 leading-relaxed">{myPet.pets.effect.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl p-6 mb-8 text-center"
                style={{ background: 'rgba(20,14,4,0.7)', border: '1px dashed rgba(255,255,255,0.08)' }}>
                <div className="flex justify-center mb-3" style={{ color: '#374151' }}>
                  <PawIcon />
                </div>
                <p className="font-bold text-sm" style={{ color: '#4b5563' }}>Aún no tienes mascota</p>
                <p className="text-xs mt-1" style={{ color: '#374151' }}>¡Gana combates para conseguir un compañero!</p>
              </div>
            )}

            {/* Catalog */}
            {allPets.length > 0 && (
              <>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#4b5563' }}>Catálogo</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allPets.map(pet => {
                    const isOwned = pet.id === ownedId;
                    return (
                      <div key={pet.id}
                        className="rounded-xl p-4 flex items-center gap-4 transition-all duration-200"
                        style={{
                          background: isOwned ? 'rgba(20,14,4,0.98)' : 'rgba(12,10,5,0.8)',
                          border: isOwned
                            ? '1px solid rgba(34,197,94,0.25)'
                            : '1px solid rgba(255,255,255,0.05)',
                          opacity: isOwned ? 1 : 0.55,
                        }}>
                        <div className="rounded-xl p-2 flex items-center justify-center flex-shrink-0"
                          style={{ background: isOwned ? 'rgba(34,197,94,0.08)' : 'rgba(0,0,0,0.3)' }}>
                          <PetDisplay
                            petType={pet.pet_type}
                            stage={isOwned ? (myPet?.pets.evolution_stage ?? 0) : 0}
                            size={44}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black" style={{ color: isOwned ? '#e7e5e4' : '#4b5563' }}>
                            {pet.name}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: '#4b5563' }}>Nv {pet.min_level}+</p>
                          {pet.effect?.description && (
                            <p className="text-xs mt-1 truncate" style={{ color: isOwned ? '#6b7280' : '#374151' }}>
                              {pet.effect.description}
                            </p>
                          )}
                        </div>
                        {isOwned && (
                          <div className="flex-shrink-0 px-2 py-1 rounded-lg text-xs font-bold"
                            style={{
                              background: 'rgba(34,197,94,0.1)',
                              border: '1px solid rgba(34,197,94,0.2)',
                              color: '#4ade80',
                            }}>
                            Tuya
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}
