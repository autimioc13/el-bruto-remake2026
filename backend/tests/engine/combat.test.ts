import { simulateCombat, applyEquipmentBonuses } from '../../src/engine/combat';
import type { Fighter, Weapon, Pet } from '../../src/types';

const makeF = (id: string, overrides: Partial<Fighter['stats']> = {}): Fighter => ({
  id,
  name: id,
  skills: [],
  stats: { hp: 100, strength: 15, agility: 10, endurance: 5, ...overrides },
});

describe('simulateCombat', () => {
  it('returns a winner that is one of the two fighters', () => {
    const result = simulateCombat(makeF('a'), makeF('b'));
    expect(['a', 'b']).toContain(result.winner_id);
  });

  it('produces a non-empty event log', () => {
    const result = simulateCombat(makeF('a'), makeF('b'));
    expect(result.log_data.length).toBeGreaterThan(0);
  });

  it('a very strong attacker with no dodge target always wins', () => {
    const strong = makeF('strong', { strength: 200, agility: 0 });
    const weak = makeF('weak', { hp: 10, endurance: 0, agility: 0 });
    const result = simulateCombat(strong, weak);
    expect(result.winner_id).toBe('strong');
  });

  it('the last HP event in the log shows 0 HP for the loser', () => {
    const result = simulateCombat(makeF('a'), makeF('b'));
    const hpEvents = result.log_data.filter(
      e => e.defender_hp !== undefined || e.attacker_hp !== undefined
    );
    const last = hpEvents[hpEvents.length - 1];
    const finalHp = last.defender_hp ?? last.attacker_hp;
    expect(finalHp).toBe(0);
  });

  it('never produces more than 200 events even with extreme endurance', () => {
    const result = simulateCombat(
      makeF('a', { endurance: 999 }),
      makeF('b', { endurance: 999 })
    );
    expect(result.log_data.length).toBeLessThanOrEqual(200);
  });

  it('high agility produces more dodges than zero agility over many combats', () => {
    let fastDodges = 0;
    for (let i = 0; i < 30; i++) {
      const r = simulateCombat(makeF('a', { agility: 0 }), makeF('fast', { agility: 80 }));
      // actor='attacker' means it was the attacker's turn — the defender (fast) can dodge
      fastDodges += r.log_data.filter(e => e.action === 'dodge' && e.actor === 'attacker').length;
    }
    const slowResult = simulateCombat(makeF('a', { agility: 0 }), makeF('slow', { agility: 0 }));
    const slowDodges = slowResult.log_data.filter(e => e.action === 'dodge' && e.actor === 'attacker').length;
    expect(fastDodges).toBeGreaterThan(slowDodges);
  });
});

const makeWeapon = (overrides: Partial<Weapon['effect']> = {}): Weapon => ({
  id: 'w1', name: 'Test', weapon_type: 'sword', rarity: 'common',
  effect: { strength_bonus: 0, agility_bonus: 0, endurance_bonus: 0, hp_bonus: 0, ...overrides },
  min_level: 1, svg_key: 'sword',
});

const makePet = (overrides: Partial<Pet['effect']> = {}): Pet => ({
  id: 'p1', name: 'Bear', pet_type: 'bear', evolution_stage: 1, evolves_to: null,
  effect: { hp_bonus: 0, strength_bonus: 0, agility_bonus: 0, endurance_bonus: 0, ...overrides },
  min_level: 1, svg_key: 'bear',
});

describe('applyEquipmentBonuses', () => {
  it('adds weapon strength_bonus to fighter stats', () => {
    const f = { ...makeF('a'), weapon: makeWeapon({ strength_bonus: 10 }) };
    expect(applyEquipmentBonuses(f).stats.strength).toBe(f.stats.strength + 10);
  });

  it('adds pet hp_bonus to fighter stats', () => {
    const f = { ...makeF('a'), pet: makePet({ hp_bonus: 15 }) };
    expect(applyEquipmentBonuses(f).stats.hp).toBe(f.stats.hp + 15);
  });

  it('stacks weapon and pet bonuses', () => {
    const f = {
      ...makeF('a'),
      weapon: makeWeapon({ agility_bonus: 5 }),
      pet: makePet({ agility_bonus: 8 }),
    };
    expect(applyEquipmentBonuses(f).stats.agility).toBe(f.stats.agility + 13);
  });

  it('handles null weapon and pet without error', () => {
    const f = { ...makeF('a'), weapon: null, pet: null };
    expect(applyEquipmentBonuses(f).stats).toEqual(f.stats);
  });
});
