const OUTFITS: Record<string, { main: string; accent: string; inner: string; pants: string }> = {
  'Bruto':     { main: '#6B4A1A', accent: '#3D2808', inner: '#E8B84B', pants: '#4A3010' },
  'Gladiador': { main: '#5A6B40', accent: '#384428', inner: '#A8C840', pants: '#38441E' },
  'Asesino':   { main: '#1C1C30', accent: '#0D0D1A', inner: '#7070C0', pants: '#0D0D22' },
  'Monje':     { main: '#2C3E90', accent: '#1A2460', inner: '#80A8FF', pants: '#1A2460' },
  'Berserker': { main: '#780A0A', accent: '#4A0808', inner: '#E03030', pants: '#4A0808' },
  'Cazador':   { main: '#504210', accent: '#2E2606', inner: '#D4A800', pants: '#2E2606' },
};

function hairSVG(style: string, color: string): string {
  switch (style) {
    case 'long':
      return `
        <path d="M12 22 Q12 3 30 3 Q48 3 48 22" fill="${color}"/>
        <rect x="11" y="16" width="6" height="12" rx="3" fill="${color}"/>
        <rect x="43" y="16" width="6" height="12" rx="3" fill="${color}"/>
        <path d="M11 24 Q8 36 10 50 Q12 58 15 60" stroke="${color}" stroke-width="8" fill="none" stroke-linecap="round"/>
        <path d="M49 24 Q52 36 50 50 Q48 58 45 60" stroke="${color}" stroke-width="8" fill="none" stroke-linecap="round"/>
        <path d="M18 3 Q30 0 42 3" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>
      `;
    case 'mohawk':
      return `
        <rect x="24" y="8" width="12" height="14" rx="2" fill="${color}"/>
        <polygon points="30,0 26,9 34,9" fill="${color}"/>
        <polygon points="26,2 22,11 30,11" fill="${color}"/>
        <polygon points="34,2 30,11 38,11" fill="${color}"/>
        <rect x="11" y="18" width="5" height="6" rx="2.5" fill="${color}" opacity="0.5"/>
        <rect x="44" y="18" width="5" height="6" rx="2.5" fill="${color}" opacity="0.5"/>
      `;
    case 'bald':
      return `<ellipse cx="30" cy="8" rx="14" ry="6" fill="rgba(0,0,0,0.06)"/>`;
    case 'short':
    default:
      return `
        <path d="M12 22 Q12 3 30 3 Q48 3 48 22" fill="${color}"/>
        <rect x="11" y="16" width="5" height="10" rx="2.5" fill="${color}"/>
        <rect x="44" y="16" width="5" height="10" rx="2.5" fill="${color}"/>
        <path d="M18 3 Q30 0 42 3" stroke="${color}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      `;
  }
}

function rankAccentSVG(rank: string, outfit: typeof OUTFITS[string]): string {
  switch (rank) {
    case 'Gladiador':
      return `
        <ellipse cx="13" cy="46" rx="7" ry="4.5" fill="${outfit.accent}"/>
        <ellipse cx="47" cy="46" rx="7" ry="4.5" fill="${outfit.accent}"/>
        <rect x="25" y="58" width="10" height="7" rx="2" fill="${outfit.inner}"/>
      `;
    case 'Asesino':
      return `
        <rect x="14" y="30" width="32" height="7" rx="3.5" fill="${outfit.accent}" opacity="0.8"/>
        <rect x="25" y="58" width="10" height="7" rx="2" fill="${outfit.inner}"/>
      `;
    case 'Monje':
      return `
        <path d="M16 44 L21 64 L39 64 L44 44" fill="${outfit.inner}" opacity="0.4"/>
        <rect x="23" y="43" width="14" height="6" rx="3" fill="${outfit.inner}" opacity="0.8"/>
      `;
    case 'Berserker':
      return `
        <path d="M4 41 L13 49 L7 55 Z" fill="${outfit.accent}"/>
        <path d="M56 41 L47 49 L53 55 Z" fill="${outfit.accent}"/>
        <path d="M20 47 Q30 45 40 47" stroke="${outfit.inner}" stroke-width="2" fill="none" opacity="0.7"/>
        <rect x="25" y="58" width="10" height="7" rx="2" fill="${outfit.inner}"/>
      `;
    case 'Cazador':
      return `
        <path d="M13 14 Q22 4 30 2 Q38 4 47 14" stroke="${outfit.inner}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <rect x="25" y="58" width="10" height="7" rx="2" fill="${outfit.inner}"/>
      `;
    default: // Bruto
      return `<rect x="25" y="58" width="10" height="7" rx="2" fill="${outfit.inner}"/>`;
  }
}

export function characterSVG(
  skinColor: string,
  hairColor: string,
  rank = 'Bruto',
  hairStyle = 'short',
): string {
  const o = OUTFITS[rank] ?? OUTFITS['Bruto'];
  const shadow = 'rgba(0,0,0,0.22)';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="90" viewBox="0 0 60 90">
  <!-- Ground shadow -->
  <ellipse cx="30" cy="88" rx="17" ry="3" fill="${shadow}"/>

  <!-- BOOTS -->
  <ellipse cx="23" cy="83" rx="8" ry="5" fill="${o.accent}"/>
  <ellipse cx="37" cy="83" rx="8" ry="5" fill="${o.accent}"/>
  <rect x="16" y="76" width="14" height="9" rx="4" fill="${o.accent}"/>
  <rect x="30" y="76" width="14" height="9" rx="4" fill="${o.accent}"/>

  <!-- LEGS (skin showing above boots) -->
  <rect x="19" y="64" width="9" height="16" rx="4" fill="${skinColor}"/>
  <rect x="32" y="64" width="9" height="16" rx="4" fill="${skinColor}"/>

  <!-- PANTS -->
  <path d="M15 63 Q18 78 23 78 Q27 78 30 72 Q33 78 37 78 Q42 78 45 63 Z" fill="${o.pants}"/>
  <rect x="15" y="60" width="30" height="8" rx="3" fill="${o.pants}"/>

  <!-- BODY -->
  <rect x="13" y="41" width="34" height="22" rx="7" fill="${o.main}"/>
  <!-- Chest panel -->
  <rect x="21" y="41" width="18" height="16" rx="4" fill="${o.inner}" opacity="0.3"/>

  <!-- RANK ACCENT -->
  ${rankAccentSVG(rank, o)}

  <!-- BELT -->
  <rect x="13" y="58" width="34" height="5" rx="2.5" fill="${o.accent}"/>

  <!-- ARMS -->
  <rect x="3" y="42" width="11" height="20" rx="5.5" fill="${skinColor}"/>
  <rect x="46" y="42" width="11" height="20" rx="5.5" fill="${skinColor}"/>

  <!-- FISTS -->
  <circle cx="9" cy="63" r="7" fill="${skinColor}"/>
  <circle cx="51" cy="63" r="7" fill="${skinColor}"/>
  <!-- Knuckle lines -->
  <path d="M5 62 Q9 65 13 62" stroke="${shadow}" stroke-width="1.2" fill="none"/>
  <path d="M47 62 Q51 65 55 62" stroke="${shadow}" stroke-width="1.2" fill="none"/>

  <!-- NECK -->
  <rect x="24" y="37" width="12" height="8" rx="4" fill="${skinColor}"/>

  <!-- HEAD -->
  <circle cx="30" cy="22" r="19" fill="${skinColor}"/>
  <!-- Jaw shadow -->
  <ellipse cx="30" cy="36" rx="14" ry="5" fill="${shadow}" opacity="0.25"/>

  <!-- HAIR -->
  ${hairSVG(hairStyle, hairColor)}

  <!-- EARS -->
  <ellipse cx="11" cy="23" rx="4" ry="5.5" fill="${skinColor}"/>
  <ellipse cx="49" cy="23" rx="4" ry="5.5" fill="${skinColor}"/>
  <!-- Ear inner -->
  <ellipse cx="11.5" cy="23" rx="2" ry="3" fill="${shadow}" opacity="0.2"/>
  <ellipse cx="48.5" cy="23" rx="2" ry="3" fill="${shadow}" opacity="0.2"/>

  <!-- EYE WHITES -->
  <ellipse cx="22" cy="21" rx="6.5" ry="7.5" fill="white"/>
  <ellipse cx="38" cy="21" rx="6.5" ry="7.5" fill="white"/>
  <!-- Eye outline -->
  <ellipse cx="22" cy="21" rx="6.5" ry="7.5" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="0.8"/>
  <ellipse cx="38" cy="21" rx="6.5" ry="7.5" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="0.8"/>
  <!-- Upper lash -->
  <path d="M15.5 15.5 Q22 13 28.5 15.5" stroke="rgba(0,0,0,0.6)" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path d="M31.5 15.5 Q38 13 44.5 15.5" stroke="rgba(0,0,0,0.6)" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <!-- IRISES -->
  <circle cx="22" cy="22" r="4.5" fill="#3A6898"/>
  <circle cx="38" cy="22" r="4.5" fill="#3A6898"/>
  <!-- PUPILS -->
  <circle cx="22.5" cy="22.5" r="2.8" fill="#111122"/>
  <circle cx="38.5" cy="22.5" r="2.8" fill="#111122"/>
  <!-- Eye shine -->
  <circle cx="24" cy="19.5" r="1.4" fill="white" opacity="0.95"/>
  <circle cx="40" cy="19.5" r="1.4" fill="white" opacity="0.95"/>
  <circle cx="21" cy="24" r="0.7" fill="white" opacity="0.5"/>
  <circle cx="37" cy="24" r="0.7" fill="white" opacity="0.5"/>

  <!-- EYEBROWS -->
  <path d="M15.5 13.5 Q22 10.5 27.5 13.5" stroke="${hairColor}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M32.5 13.5 Q38 10.5 44.5 13.5" stroke="${hairColor}" stroke-width="2.5" fill="none" stroke-linecap="round"/>

  <!-- NOSE -->
  <path d="M27.5 28 Q30 30.5 32.5 28" stroke="${shadow}" stroke-width="1.6" fill="none" stroke-linecap="round"/>

  <!-- MOUTH — determined grin -->
  <path d="M21 33 Q30 37.5 39 33" stroke="#7A3030" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path d="M21 33 Q23.5 35 26 33" fill="rgba(220,120,120,0.3)"/>
  <path d="M34 33 Q36.5 35 39 33" fill="rgba(220,120,120,0.3)"/>
  <!-- Teeth hint -->
  <path d="M23 33.5 Q30 36 37 33.5" stroke="white" stroke-width="1.5" fill="none" opacity="0.6"/>
</svg>`;
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}
