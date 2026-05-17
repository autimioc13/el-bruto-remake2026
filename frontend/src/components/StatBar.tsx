interface Props {
  label: string;
  value: number;
  max?: number;
}

export default function StatBar({ label, value, max = 200 }: Props) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm font-bold text-amber-900">
        <span>{label}</span><span>{value}</span>
      </div>
      <div className="w-full bg-amber-200 rounded h-3">
        <div className="bg-amber-700 h-3 rounded transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
