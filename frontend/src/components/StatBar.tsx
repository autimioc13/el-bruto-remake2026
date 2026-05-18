interface Props {
  label: string;
  value: number;
  max?: number;
}

const BAR_COLORS: Record<string, string> = {
  'Vida':        '#ef4444',
  'Fuerza':      '#f97316',
  'Agilidad':    '#3b82f6',
  'Resistencia': '#22c55e',
};

const ICONS: Record<string, string> = {
  'Vida':        '❤',
  'Fuerza':      '⚡',
  'Agilidad':    '💨',
  'Resistencia': '🛡',
};

export default function StatBar({ label, value, max = 200 }: Props) {
  const pct = Math.min(100, (value / max) * 100);
  const color = BAR_COLORS[label] ?? '#f59e0b';
  const icon = ICONS[label] ?? '•';
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-bold text-stone-300 flex items-center gap-1">
          <span className="text-xs">{icon}</span> {label}
        </span>
        <span className="text-sm font-black" style={{ color }}>{value}</span>
      </div>
      <div className="w-full rounded-full h-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}80` }} />
      </div>
    </div>
  );
}
