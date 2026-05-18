export interface Stats {
  hp: number;
  strength: number;
  agility: number;
  endurance: number;
}

export interface Appearance {
  gender: 'male' | 'female';
  hair_color: string;
  skin_color: string;
  hair_style: string;
  body?: string;
  colors?: string;
}

export interface SkillEffect {
  type: string;
  value: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  effect: SkillEffect;
}

export interface WeaponEffect {
  strength_bonus: number;
  agility_bonus: number;
  endurance_bonus: number;
  hp_bonus: number;
}

export interface Weapon {
  id: string;
  name: string;
  weapon_type: string;
  rarity: string;
  effect: WeaponEffect;
  min_level: number;
  svg_key: string;
}

export interface PetEffect {
  hp_bonus: number;
  strength_bonus: number;
  agility_bonus: number;
  endurance_bonus: number;
}

export interface Pet {
  id: string;
  name: string;
  pet_type: string;
  evolution_stage: number;
  evolves_to: string | null;
  effect: PetEffect;
  min_level: number;
  svg_key: string;
}

export interface Rank {
  min_level: number;
  name: string;
  color: string;
}

export interface Clan {
  id: string;
  name: string;
  description: string;
  leader_id: string;
  total_wins: number;
}

export interface Character {
  id: string;
  user_id: string;
  name: string;
  level: number;
  xp: number;
  xp_to_next_level: number;
  wins: number;
  losses: number;
  appearance: Appearance;
  stats: Stats;
  created_at: string;
}

export interface CombatEvent {
  turn: number;
  actor: 'attacker' | 'defender';
  action: 'attack' | 'dodge' | 'critical' | 'skill';
  damage?: number;
  skill?: string;
  defender_hp?: number;
  attacker_hp?: number;
}

export interface CombatResult {
  winner_id: string;
  log_data: CombatEvent[];
}

export interface Fighter {
  id: string;
  name: string;
  stats: Stats;
  skills: Skill[];
  weapon?: Weapon | null;
  pet?: Pet | null;
}

export type UnlockType = 'stat' | 'skill' | 'weapon' | 'pet';

export interface UnlockInfo {
  type: UnlockType;
  item_id?: string;
  label: string;
}

export interface LevelUpResult {
  character: Character;
  unlock: UnlockInfo;
  new_rank?: string;
}
