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
}
