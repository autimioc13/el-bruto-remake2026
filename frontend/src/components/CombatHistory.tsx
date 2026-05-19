import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

interface CombatEntry {
  id: string;
  attacker_id: string;
  defender_id: string;
  winner_id: string;
  attacker_name: string;
  defender_name: string;
  created_at: string;
}

interface Props {
  characterId: string;
  isOwn?: boolean;
}

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'Hace un momento';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
  const days = Math.floor(diff / 86400);
  if (days < 7) return `Hace ${days}d`;
  return date.toLocaleDateString('es', { month: 'short', day: 'numeric' });
}

const ChevronRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

export default function CombatHistory({ characterId, isOwn = false }: Props) {
  const [history, setHistory] = useState<CombatEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!characterId) return;
    const endpoint = isOwn ? '/combat/history' : `/combat/history/${characterId}`;
    api.get(endpoint)
      .then(({ data }) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [characterId, isOwn]);

  if (loading) return (
    <div className="py-4 text-center">
      <div className="text-xs animate-pulse" style={{ color: '#4b5563' }}>Cargando historial...</div>
    </div>
  );

  if (history.length === 0) return (
    <div className="py-6 text-center">
      <p className="text-sm font-bold" style={{ color: '#374151' }}>Sin combates registrados</p>
      <p className="text-xs mt-1" style={{ color: '#1f2937' }}>Los combates aparecerán aquí</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {history.map(entry => {
        const won = entry.winner_id === characterId;
        const opponent = entry.attacker_id === characterId
          ? entry.defender_name
          : entry.attacker_name;

        return (
          <button
            key={entry.id}
            onClick={() => navigate(`/replay/${entry.id}`)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 hover:opacity-90 active:scale-[0.99]"
            style={{
              background: won ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
              border: won ? '1px solid rgba(34,197,94,0.15)' : '1px solid rgba(239,68,68,0.12)',
              cursor: 'pointer',
            }}>
            {/* Result badge */}
            <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0"
              style={{
                background: won ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)',
                color: won ? '#4ade80' : '#f87171',
              }}>
              {won ? 'WIN' : 'DEF'}
            </div>

            {/* Opponent + time */}
            <div className="flex-1 min-w-0 text-left">
              <p className="font-bold text-sm text-stone-200 truncate">vs {opponent}</p>
              <p className="text-xs" style={{ color: '#6b7280' }}>
                {timeAgo(new Date(entry.created_at))}
              </p>
            </div>

            {/* Replay hint */}
            <div className="flex items-center gap-1 flex-shrink-0" style={{ color: '#4b5563' }}>
              <span className="text-xs">Replay</span>
              <ChevronRightIcon />
            </div>
          </button>
        );
      })}
    </div>
  );
}
