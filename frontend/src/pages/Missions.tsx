import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

interface Mission {
  id: string;
  name: string;
  desc: string;
  goal: number;
  progress: number;
  reward: string;
  icon: 'sword' | 'trophy';
}

const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

const SwordIcon = ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/>
    <line x1="13" y1="19" x2="19" y2="13"/>
    <line x1="16" y1="16" x2="20" y2="20"/>
    <line x1="19" y1="21" x2="21" y2="19"/>
  </svg>
);

const TrophyIcon = ({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="8 6 4 6 4 14 8 14"/>
    <polyline points="16 6 20 6 20 14 16 14"/>
    <path d="M8 6h8v8a4 4 0 0 1-8 0V6Z"/>
    <line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="8" y1="22" x2="16" y2="22"/>
  </svg>
);

function useCountdown(resetAt: string) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!resetAt) return;
    const update = () => {
      const diff = new Date(resetAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining('00:00:00'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [resetAt]);

  return remaining;
}

export default function Missions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [resetAt, setResetAt] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const countdown = useCountdown(resetAt);

  useEffect(() => {
    api.get('/missions/daily')
      .then(({ data }) => { setMissions(data.missions); setResetAt(data.reset_at); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const completed = missions.filter(m => m.progress >= m.goal).length;

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
          <p className="text-amber-700 text-xs font-bold tracking-widest uppercase mb-2">Desafíos del día</p>
          <h1 className="font-black text-5xl" style={{ color: '#f59e0b', textShadow: '0 0 30px rgba(245,158,11,0.4)' }}>
            MISIONES
          </h1>
        </div>

        {/* Progress summary + reset timer */}
        <div className="rounded-2xl p-5 mb-6 flex items-center justify-between"
          style={{ background: 'rgba(20,14,4,0.98)', border: '1px solid rgba(180,130,20,0.2)' }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#6b7280' }}>
              Progreso de hoy
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-black text-3xl" style={{ color: '#f59e0b' }}>{completed}</span>
              <span className="text-stone-500 font-bold">/ {missions.length} misiones</span>
            </div>
          </div>
          {countdown && (
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#6b7280' }}>
                Reinicio en
              </p>
              <p className="font-black text-xl font-mono" style={{ color: '#4b5563' }}>{countdown}</p>
            </div>
          )}
        </div>

        {loading && (
          <div className="text-center py-12">
            <p className="text-amber-700 text-sm animate-pulse font-bold">Cargando misiones...</p>
          </div>
        )}

        {/* Mission cards */}
        <div className="space-y-3">
          {missions.map(mission => {
            const done = mission.progress >= mission.goal;
            const pct = Math.min(100, (mission.progress / mission.goal) * 100);

            return (
              <div key={mission.id}
                className="rounded-2xl p-5 transition-all duration-200"
                style={{
                  background: done ? 'rgba(34,197,94,0.06)' : 'rgba(20,14,4,0.97)',
                  border: done
                    ? '1px solid rgba(34,197,94,0.25)'
                    : '1px solid rgba(180,130,20,0.15)',
                }}>
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: done ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.1)',
                    }}>
                    {mission.icon === 'trophy'
                      ? <TrophyIcon color={done ? '#4ade80' : '#f59e0b'} />
                      : <SwordIcon color={done ? '#4ade80' : '#f59e0b'} />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="font-black text-stone-100">{mission.name}</p>
                      {done && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
                          Completada
                        </span>
                      )}
                    </div>
                    <p className="text-xs mb-3" style={{ color: '#6b7280' }}>{mission.desc}</p>

                    {/* Progress bar */}
                    <div className="w-full rounded-full h-2 mb-1.5"
                      style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: done
                            ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                            : 'linear-gradient(90deg, #f59e0b, #d97706)',
                          boxShadow: done
                            ? '0 0 8px rgba(74,222,128,0.4)'
                            : '0 0 8px rgba(245,158,11,0.3)',
                        }} />
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold" style={{ color: '#4b5563' }}>
                        {mission.progress} / {mission.goal}
                      </p>
                      <p className="text-xs font-bold" style={{ color: done ? '#4ade80' : '#6b7280' }}>
                        {mission.reward}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Go fight CTA */}
        {!loading && completed < missions.length && (
          <button onClick={() => navigate('/ranking')}
            className="w-full mt-6 py-4 font-black text-white rounded-xl transition-all hover:opacity-90 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #991b1b, #7f1d1d)',
              boxShadow: '0 4px 20px rgba(153,27,27,0.4)',
              cursor: 'pointer',
            }}>
            Ir a combatir
          </button>
        )}

      </div>
    </div>
  );
}
