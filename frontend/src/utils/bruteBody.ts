export interface BruteBodyParts {
  p1: number; p1a: number; p1b: number; p2: number;
  p3: number; p4: number; p5: number; p6: number;
  p7: number; p7b: number; p8: number;
}

// Max values per body part (from labrute availableBodyParts.ts)
const MALE_MAX   = { p1:1, p1a:1, p1b:1, p2:7, p3:11, p4:5, p5:1, p6:1, p7:6, p7b:2, p8:4 };
const FEMALE_MAX = { p1:1, p1a:1, p1b:1, p2:0, p3:11, p4:3, p5:1, p6:0, p7:6, p7b:2, p8:4 };

export function readBodyString(s: string): BruteBodyParts {
  const h = (i: number) => parseInt(s[i] || '0', 16);
  return { p1:h(0), p1a:h(1), p1b:h(2), p2:h(3), p3:h(4), p4:h(5), p5:h(6), p6:h(7), p7:h(8), p7b:h(9), p8:h(10) };
}

function rh(max: number): string {
  return Math.floor(Math.random() * (max + 1)).toString(16);
}

export function getRandomBody(gender: 'male' | 'female'): string {
  const p = gender === 'male' ? MALE_MAX : FEMALE_MAX;
  return [rh(p.p1),rh(p.p1a),rh(p.p1b),rh(p.p2),rh(p.p3),rh(p.p4),rh(p.p5),rh(p.p6),rh(p.p7),rh(p.p7b),rh(p.p8)].join('');
}
