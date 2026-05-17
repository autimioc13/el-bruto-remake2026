const RANK_COLORS: Record<string, string> = {
  'Bruto':     '#8B4513',
  'Gladiador': '#CD853F',
  'Asesino':   '#708090',
  'Monje':     '#4169E1',
  'Berserker': '#DC143C',
  'Cazador':   '#FFD700',
};

export default function RankBadge({ rank }: { rank: string }) {
  const color = RANK_COLORS[rank] ?? '#8B4513';
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {rank}
    </span>
  );
}
