export const WEAPON_SVGS: Record<string, string> = {
  club: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="60" viewBox="0 0 30 60">
    <rect x="12" y="12" width="6" height="38" rx="3" fill="#6B3A2A"/>
    <ellipse cx="15" cy="10" rx="9" ry="7" fill="#4A2416"/>
  </svg>`,
  dagger: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="60" viewBox="0 0 30 60">
    <polygon points="15,3 11,30 19,30" fill="#C8C8C8"/>
    <rect x="7" y="30" width="16" height="4" rx="2" fill="#DAA520"/>
    <rect x="12" y="34" width="6" height="12" rx="2" fill="#6B3A2A"/>
  </svg>`,
  sword: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="60" viewBox="0 0 30 60">
    <polygon points="15,2 11,40 19,40" fill="#C8C8C8"/>
    <line x1="15" y1="2" x2="15" y2="40" stroke="#A0A0A0" stroke-width="1"/>
    <rect x="5" y="40" width="20" height="4" rx="2" fill="#DAA520"/>
    <rect x="12" y="44" width="6" height="12" rx="2" fill="#6B3A2A"/>
  </svg>`,
  shuriken: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    <polygon points="20,2 23,17 38,20 23,23 20,38 17,23 2,20 17,17" fill="#B0BEC5"/>
    <circle cx="20" cy="20" r="4" fill="#607D8B"/>
  </svg>`,
  axe: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="60" viewBox="0 0 36 60">
    <rect x="15" y="22" width="5" height="36" rx="2" fill="#6B3A2A"/>
    <path d="M20,4 Q36,4 34,22 L20,22 Z" fill="#B0BEC5"/>
    <path d="M16,4 Q0,4 2,22 L16,22 Z" fill="#90A4AE"/>
  </svg>`,
  hammer: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="60" viewBox="0 0 34 60">
    <rect x="14" y="24" width="5" height="34" rx="2" fill="#6B3A2A"/>
    <rect x="4" y="5" width="26" height="20" rx="4" fill="#757575"/>
    <rect x="4" y="5" width="26" height="4" rx="2" fill="#9E9E9E"/>
  </svg>`,
  katana: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="70" viewBox="0 0 30 70">
    <path d="M15,2 Q17,30 16,55" stroke="#E0E0E0" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M15,2 Q13,30 14,55" stroke="#BDBDBD" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <rect x="8" y="55" width="14" height="3" rx="1" fill="#DAA520"/>
    <rect x="12" y="58" width="6" height="10" rx="2" fill="#C62828"/>
  </svg>`,
  lance: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="80" viewBox="0 0 20 80">
    <polygon points="10,2 7,20 13,20" fill="#C8C8C8"/>
    <rect x="8" y="20" width="4" height="58" rx="2" fill="#6B3A2A"/>
  </svg>`,
  bow: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="70" viewBox="0 0 34 70">
    <path d="M22,5 Q6,35 22,65" stroke="#6B3A2A" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <line x1="22" y1="5" x2="22" y2="65" stroke="#DAA520" stroke-width="1.2"/>
  </svg>`,
  scythe: `<svg xmlns="http://www.w3.org/2000/svg" width="55" height="70" viewBox="0 0 55 70">
    <rect x="24" y="18" width="4" height="50" rx="2" fill="#424242" transform="rotate(12,26,43)"/>
    <path d="M26,6 Q54,4 50,26 Q38,32 26,22 Z" fill="#212121"/>
    <path d="M26,6 Q54,4 50,26 Q44,22 40,16 Q46,8 36,6 Z" fill="#424242"/>
  </svg>`,
};

export const RARITY_COLORS: Record<string, string> = {
  common:    '#9E9E9E',
  rare:      '#2196F3',
  epic:      '#9C27B0',
  legendary: '#FF9800',
  mythic:    '#F44336',
};
