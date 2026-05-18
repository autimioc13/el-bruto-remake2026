const CLOTH: string[] = ['7bad30','b78104','bb1111','559399','fae31f','784129','7a73c8','fff9ae','f0dc99','b6e7a9','d31818','b85f1d','97cbff','8ba3d7','df7e37','d5eaff','ffaa1e','cbff97','ffcc79','fff2df'];
const ZONES = ['col0','col0a','col0c','col1','col1a','col1b','col1c','col1d','col2','col2a','col2b','col3','col3b','col4','col4a','col4b'];
const MALE_MAX   = [1,1,1,7,11,5,1,1,6,2,4];
const FEMALE_MAX = [1,1,1,0,11,3,1,0,6,2,4];

function rnd<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]!; }
function rh(max: number): string { return Math.floor(Math.random() * (max + 1)).toString(16); }
function strip(c: string): string { return c.replace('#', '').padEnd(6, '0').slice(0, 6); }

export function generateBody(gender: 'male' | 'female'): string {
  const p = gender === 'male' ? MALE_MAX : FEMALE_MAX;
  return p.map(rh).join('');
}

export function generateColors(skin: string, hair: string): string {
  const cl1 = rnd(CLOTH), cl2 = rnd(CLOTH), cl3 = rnd(CLOTH);
  const map: Record<string, string> = {
    col0: strip(skin), col0a: strip(skin), col0c: strip(skin),
    col1: strip(hair), col1a: strip(hair), col1b: strip(hair), col1c: strip(hair), col1d: strip(hair),
    col2: cl1, col2a: cl1, col2b: cl1,
    col3: cl2, col3b: cl2,
    col4: cl3, col4a: cl3, col4b: cl3,
  };
  return ZONES.map(z => map[z]!).join('');
}

export function ensureBodyColors(appearance: any): { body: string; colors: string } | null {
  if (!appearance) return null;
  if (appearance.body && appearance.colors) return null; // already has them
  return {
    body:   generateBody(appearance.gender ?? 'male'),
    colors: generateColors(appearance.skin_color ?? 'fdbcb4', appearance.hair_color ?? '8b4513'),
  };
}
