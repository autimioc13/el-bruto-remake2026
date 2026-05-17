import { Character, Stats } from '../types';

export interface LevelUpResult {
  character: Character;
  reward: string;
}

export function calculateXpGain(winnerLevel: number, loserLevel: number): number {
  const base = 20;
  const bonus = Math.max(0, loserLevel - winnerLevel) * 10;
  return Math.max(1, base + bonus);
}

export function shouldLevelUp(character: Character): boolean {
  return character.xp >= character.xp_to_next_level;
}

type StatKey = keyof Stats;

const STAT_KEYS: StatKey[] = ['hp', 'strength', 'agility', 'endurance'];

const INCREMENTS: Record<StatKey, number> = {
  hp: 10,
  strength: 2,
  agility: 2,
  endurance: 2,
};

const LABELS: Record<StatKey, string> = {
  hp: 'Vida',
  strength: 'Fuerza',
  agility: 'Agilidad',
  endurance: 'Resistencia',
};

export function applyLevelUp(character: Character): LevelUpResult {
  const stat = STAT_KEYS[Math.floor(Math.random() * STAT_KEYS.length)];
  const increment = INCREMENTS[stat];

  const updated: Character = {
    ...character,
    level: character.level + 1,
    xp: 0,
    xp_to_next_level: Math.floor(character.xp_to_next_level * 1.5),
    stats: { ...character.stats, [stat]: character.stats[stat] + increment },
  };

  return { character: updated, reward: `+${increment} ${LABELS[stat]}` };
}
