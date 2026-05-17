const RANK_COLORS: Record<string, string> = {
  'Bruto':     '#8B4513',
  'Gladiador': '#CD853F',
  'Asesino':   '#708090',
  'Monje':     '#4169E1',
  'Berserker': '#DC143C',
  'Cazador':   '#FFD700',
};

export function characterSVG(skinColor: string, hairColor: string, rank = 'Bruto'): string {
  const armor = RANK_COLORS[rank] ?? '#8B4513';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="90" viewBox="0 0 60 90">
    <ellipse cx="30" cy="87" rx="18" ry="3" fill="rgba(0,0,0,0.15)"/>
    <rect x="19" y="63" width="10" height="22" rx="4" fill="${skinColor}"/>
    <rect x="31" y="63" width="10" height="22" rx="4" fill="${skinColor}"/>
    <rect x="12" y="35" width="36" height="30" rx="6" fill="${armor}"/>
    <rect x="3" y="37" width="10" height="19" rx="4" fill="${skinColor}"/>
    <rect x="47" y="37" width="10" height="19" rx="4" fill="${skinColor}"/>
    <circle cx="30" cy="22" r="17" fill="${skinColor}"/>
    <ellipse cx="30" cy="9" rx="15" ry="9" fill="${hairColor}"/>
    <circle cx="23" cy="21" r="3" fill="white"/>
    <circle cx="37" cy="21" r="3" fill="white"/>
    <circle cx="24" cy="22" r="1.5" fill="#222"/>
    <circle cx="38" cy="22" r="1.5" fill="#222"/>
    <path d="M24 28 Q30 26 36 28" stroke="#555" stroke-width="1.5" fill="none"/>
    <path d="M19 16 L27 18" stroke="${hairColor}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M41 16 L33 18" stroke="${hairColor}" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`;
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}
