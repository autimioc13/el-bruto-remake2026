// Original color palettes from labrute core/src/brute/colors.ts
export const SKIN_M  = ['#996600','#eccd57','#cb841b','#d79b75','#fbe6c8','#f8d198'];
export const SKIN_F  = ['#996600','#f8cdc2','#cb841b','#eaaca6','#fbe6c8','#f8d198'];
export const HAIR_M  = ['#784129','#fff9ae','#b85f1d','#4f677d','#df7e37','#fbcd15','#ffaa1e','#952f04','#a2886f','#fff2df'];
export const HAIR_F  = ['#fff9ae','#b85f1d','#eea2c9','#8e63ad','#fbcd15','#ffaa1e','#952f04','#a2886f','#fff2df'];
export const CLOTH   = ['#7bad30','#b78104','#bb1111','#559399','#fae31f','#784129','#7a73c8','#fff9ae','#f0dc99','#b6e7a9','#d31818','#b85f1d','#97cbff','#8ba3d7','#df7e37','#d5eaff','#ffaa1e','#cbff97','#ffcc79','#fff2df'];

export type BruteColors = {
  col0:string; col0a:string; col0c:string;
  col1:string; col1a:string; col1b:string; col1c:string; col1d:string;
  col2:string; col2a:string; col2b:string;
  col3:string; col3b:string;
  col4:string; col4a:string; col4b:string;
};

export const COLOR_ZONES = [
  'col0','col0a','col0c','col1','col1a','col1b','col1c','col1d',
  'col2','col2a','col2b','col3','col3b','col4','col4a','col4b',
] as const;

function rnd<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]!; }

export function makeColorsString(skin: string, hair: string): string {
  const cl1 = rnd(CLOTH); const cl2 = rnd(CLOTH); const cl3 = rnd(CLOTH);
  const zones: BruteColors = {
    col0:skin, col0a:skin, col0c:skin,
    col1:hair, col1a:hair, col1b:hair, col1c:hair, col1d:hair,
    col2:cl1,  col2a:cl1,  col2b:cl1,
    col3:cl2,  col3b:cl2,
    col4:cl3,  col4a:cl3,  col4b:cl3,
  };
  return COLOR_ZONES.map(z => zones[z].replace('#','')).join('');
}

export function readColorString(s: string): BruteColors {
  const result: Partial<BruteColors> = {};
  COLOR_ZONES.forEach((z, i) => { result[z] = `#${s.substring(i*6,(i+1)*6)}`; });
  return result as BruteColors;
}

/** Find nearest color in palette by Euclidean RGB distance */
export function nearestColor(hex: string, palette: string[]): string {
  const toRgb = (h: string) => {
    const n = parseInt(h.replace('#',''), 16);
    return [(n>>16)&255, (n>>8)&255, n&255];
  };
  const [r,g,b] = toRgb(hex);
  let best = palette[0]!;
  let bestD = Infinity;
  for (const c of palette) {
    const [cr,cg,cb] = toRgb(c);
    const d = (r-cr)**2 + (g-cg)**2 + (b-cb)**2;
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}
