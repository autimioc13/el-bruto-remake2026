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
