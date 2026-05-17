import { WEAPON_SVGS, RARITY_COLORS } from '../sprites/weapons';

interface Props {
  weaponType: string;
  rarity?: string;
  size?: number;
}

export default function WeaponIcon({ weaponType, rarity = 'common', size = 40 }: Props) {
  const svg = WEAPON_SVGS[weaponType] ?? WEAPON_SVGS['sword'];
  const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  const borderColor = RARITY_COLORS[rarity] ?? RARITY_COLORS['common'];
  return (
    <div
      className="rounded p-1 bg-gray-800"
      style={{ border: `2px solid ${borderColor}`, display: 'inline-block' }}
    >
      <img src={dataUrl} width={size} height={size} alt={weaponType} />
    </div>
  );
}
