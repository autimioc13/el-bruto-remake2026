import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

interface Standing {
  id: string;
  name: string;
  members: number;
  war_wins: number;
  war_battles: number;
}

interface MyWar {
  id: string;
  opponent: { id: string; name: string };
  my_wins: number;
  their_wins: number;
  total_battles: number;
  last_battle_at: string | null;
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return 'Sin batallas';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Hace un momento';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
  return `Hace ${Math.floor(diff / 86400)}d`;
}

const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

const ShieldIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const SwordsIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/>
    <line x1="13" y1="19" x2="19" y2="13"/>
    <line x1="16" y1="16" x2="20" y2="20"/>
    <line x1="19" y1="21" x2="21" y2="19"/>
    <polyline points="9.5 6.5 21 18 21 21 18 21 6.5 9.5"/>
    <line x1="5" y1="11" x2="11" y2="5"/>
  </svg>
);

const rankMedals: Record<number, string> = { 0: '#f59e0b', 1: '#9ca3af', 2: '#b45309' };

export default function ClanWars() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [myWars, setMyWars] = useState<MyWar[]>([]);
  const [myClanId, setMyClanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'standings' | 'mine'>('standings');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const [standRes, mineRes] = await Promise.allSettled([
        api.get('/clan-wars/standings'),
        api.get('/clan-wars/mine'),
      ]);
      if (standRes.status === 'fulfilled') setStandings(standRes.value.data);
      if (mineRes.status === 'fulfilled') {
        setMyWars(mineRes.value.data.wars ?? []);
        setMyClanId(mineRes.value.data.clan_id ?? null);
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen p-4 sm:p-6"
      style={{ background: 'linear-gradient(180deg, #0a0800 0%, #0c0a09 100%)' }}>
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate('/clans')}
            className="flex items-center gap-1.5 text-stone-500 hover:text-amber-400 transition-colors duration-200 text-sm"
            style={{ cursor: 'pointer' }}>
            <ArrowLeftIcon />
            Clanes
          </button>
          <button onClick={() => navigate('/clans')}
            className="px-4 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, #991b1b, #7f1d1d)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(153,27,27,0.4)',
              cursor: 'pointer',
            }}>
            Atacar clan
          </button>
        </div>

        <div className="text-center mb-8">
          <p className="text-amber-700 text-xs font-bold tracking-widest uppercase mb-2">Honor entre hermandades</p>
          <h1 className="font-black text-5xl" style={{ color: '#f59e0b', textShadow: '0 0 30px rgba(245,158,11,0.4)' }}>
            GUERRAS
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl p-1 mb-6" style={{ background: 'rgba(0,0,0,0.4)' }}>
          {(['standings', 'mine'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2.5 text-sm font-black rounded-lg transition-all duration-200"
              style={tab === t
                ? { background: 'linear-gradient(135deg, #d97706, #b45309)', color: '#0c0a09' }
                : { color: '#6b7280', cursor: 'pointer' }}>
              {t === 'standings' ? 'Clasificación' : 'Mis Guerras'}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-12">
            <p className="text-amber-700 text-sm animate-pulse font-bold">Cargando...</p>
          </div>
        )}

        {/* Standings */}
        {!loading && tab === 'standings' && (
          <div className="space-y-3">
            {standings.length === 0 && (
              <div className="text-center py-16">
                <div className="flex justify-center mb-3" style={{ color: '#374151' }}>
                  <SwordsIcon size={28} />
                </div>
                <p className="font-bold text-sm" style={{ color: '#4b5563' }}>Sin guerras todavía</p>
                <p className="text-xs mt-1" style={{ color: '#374151' }}>¡Ataca otro clan para iniciar la primera!</p>
              </div>
            )}
            {standings.map((clan, i) => {
              const medal = rankMedals[i];
              const isMe = clan.id === myClanId;
              return (
                <div key={clan.id}
                  className="rounded-xl p-4 flex items-center gap-4"
                  style={{
                    background: isMe ? 'rgba(180,130,20,0.08)' : 'rgba(20,14,4,0.97)',
                    border: isMe
                      ? '1px solid rgba(180,130,20,0.3)'
                      : medal
                      ? `1px solid ${medal}30`
                      : '1px solid rgba(255,255,255,0.05)',
                  }}>
                  <div className="w-10 text-center flex-shrink-0 font-black text-sm"
                    style={{ color: medal ?? '#4b5563' }}>
                    #{i + 1}
                  </div>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: medal ? `${medal}18` : 'rgba(255,255,255,0.04)' }}>
                    <ShieldIcon size={18} color={medal ?? '#4b5563'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-stone-100 truncate">{clan.name}</p>
                      {isMe && <span className="text-xs text-amber-700 italic">(tú)</span>}
                    </div>
                    <p className="text-xs" style={{ color: '#6b7280' }}>
                      {clan.members} miembro{clan.members !== 1 ? 's' : ''} · {clan.war_battles} batallas
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-lg" style={{ color: medal ?? '#e7e5e4' }}>
                      {clan.war_wins}
                    </p>
                    <p className="text-xs" style={{ color: '#4b5563' }}>victorias</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* My Wars */}
        {!loading && tab === 'mine' && (
          <>
            {!myClanId && (
              <div className="text-center py-16">
                <div className="flex justify-center mb-3" style={{ color: '#374151' }}>
                  <ShieldIcon size={28} />
                </div>
                <p className="font-bold text-sm" style={{ color: '#4b5563' }}>No perteneces a ningún clan</p>
                <button onClick={() => navigate('/clans')}
                  className="mt-4 px-5 py-2.5 rounded-xl font-black text-sm transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', color: '#0c0a09', cursor: 'pointer' }}>
                  Unirme a un clan
                </button>
              </div>
            )}

            {myClanId && myWars.length === 0 && (
              <div className="text-center py-16">
                <div className="flex justify-center mb-3" style={{ color: '#374151' }}>
                  <SwordsIcon size={28} />
                </div>
                <p className="font-bold text-sm" style={{ color: '#4b5563' }}>Tu clan no ha guerreado aún</p>
                <p className="text-xs mt-1 mb-4" style={{ color: '#374151' }}>
                  Ataca a un rival desde la página de Clanes
                </p>
                <button onClick={() => navigate('/clans')}
                  className="px-5 py-2.5 rounded-xl font-black text-sm transition-all hover:opacity-90"
                  style={{
                    background: 'linear-gradient(135deg, #991b1b, #7f1d1d)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(153,27,27,0.4)',
                    cursor: 'pointer',
                  }}>
                  Atacar un clan
                </button>
              </div>
            )}

            {myClanId && myWars.length > 0 && (
              <div className="space-y-3">
                {myWars.map(war => {
                  const winning = war.my_wins > war.their_wins;
                  const losing = war.my_wins < war.their_wins;
                  const statusColor = winning ? '#4ade80' : losing ? '#f87171' : '#f59e0b';
                  return (
                    <div key={war.id}
                      className="rounded-2xl p-5"
                      style={{
                        background: 'rgba(20,14,4,0.98)',
                        border: `1px solid ${statusColor}25`,
                      }}>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#6b7280' }}>
                            vs
                          </p>
                          <p className="font-black text-xl text-stone-100">{war.opponent.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#4b5563' }}>
                            {timeAgo(war.last_battle_at)} · {war.total_battles} batalla{war.total_battles !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-black text-3xl" style={{ color: statusColor }}>
                            {war.my_wins}
                            <span className="text-stone-600 text-xl"> - </span>
                            {war.their_wins}
                          </p>
                          <p className="text-xs font-bold" style={{ color: statusColor }}>
                            {winning ? 'Ganando' : losing ? 'Perdiendo' : 'Empate'}
                          </p>
                        </div>
                      </div>
                      <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        {war.total_battles > 0 && (
                          <div className="h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${(war.my_wins / war.total_battles) * 100}%`,
                              background: `linear-gradient(90deg, ${statusColor}, ${statusColor}cc)`,
                            }} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
