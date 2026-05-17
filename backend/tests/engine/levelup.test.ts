import { calculateXpGain, applyLevelUp, shouldLevelUp } from '../../src/engine/levelup';
import { Character } from '../../src/types';

const makeChar = (overrides: Partial<Character> = {}): Character => ({
  id: 'c1', user_id: 'u1', name: 'Test',
  level: 1, xp: 0, xp_to_next_level: 100,
  wins: 0, losses: 0,
  appearance: { gender: 'male', hair_color: '#000', skin_color: '#fff', hair_style: 'short' },
  stats: { hp: 100, strength: 10, agility: 10, endurance: 10 },
  created_at: '',
  ...overrides,
});

describe('calculateXpGain', () => {
  it('gives more XP for beating a higher-level enemy', () => {
    expect(calculateXpGain(1, 5)).toBeGreaterThan(calculateXpGain(1, 1));
  });

  it('gives at least 1 XP regardless of level gap', () => {
    expect(calculateXpGain(10, 1)).toBeGreaterThanOrEqual(1);
  });
});

describe('shouldLevelUp', () => {
  it('returns true when xp >= xp_to_next_level', () => {
    expect(shouldLevelUp(makeChar({ xp: 100, xp_to_next_level: 100 }))).toBe(true);
  });

  it('returns false when xp < xp_to_next_level', () => {
    expect(shouldLevelUp(makeChar({ xp: 99, xp_to_next_level: 100 }))).toBe(false);
  });
});

describe('applyLevelUp', () => {
  it('increments level by 1', () => {
    expect(applyLevelUp(makeChar({ xp: 100, xp_to_next_level: 100 })).character.level).toBe(2);
  });

  it('resets xp to 0 and raises xp_to_next_level', () => {
    const r = applyLevelUp(makeChar({ xp: 100, xp_to_next_level: 100 }));
    expect(r.character.xp).toBe(0);
    expect(r.character.xp_to_next_level).toBeGreaterThan(100);
  });

  it('increases the total sum of stats', () => {
    const char = makeChar({ xp: 100, xp_to_next_level: 100 });
    const before = char.stats.hp + char.stats.strength + char.stats.agility + char.stats.endurance;
    const after = applyLevelUp(char).character.stats;
    expect(after.hp + after.strength + after.agility + after.endurance).toBeGreaterThan(before);
  });

  it('returns a non-empty reward string', () => {
    const r = applyLevelUp(makeChar({ xp: 100, xp_to_next_level: 100 }));
    expect(typeof r.reward).toBe('string');
    expect(r.reward.length).toBeGreaterThan(0);
  });
});
