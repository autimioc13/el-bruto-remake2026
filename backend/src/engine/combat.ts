import { Fighter, CombatResult, CombatEvent } from '../types';

const MAX_TURNS = 200;

export function applyEquipmentBonuses(fighter: Fighter): Fighter {
  const w = fighter.weapon?.effect;
  const p = fighter.pet?.effect;
  return {
    ...fighter,
    stats: {
      hp:        fighter.stats.hp        + (w?.hp_bonus        ?? 0) + (p?.hp_bonus        ?? 0),
      strength:  fighter.stats.strength  + (w?.strength_bonus  ?? 0) + (p?.strength_bonus  ?? 0),
      agility:   fighter.stats.agility   + (w?.agility_bonus   ?? 0) + (p?.agility_bonus   ?? 0),
      endurance: fighter.stats.endurance + (w?.endurance_bonus ?? 0) + (p?.endurance_bonus ?? 0),
    },
  };
}

export function simulateCombat(attacker: Fighter, defender: Fighter): CombatResult {
  attacker = applyEquipmentBonuses(attacker);
  defender = applyEquipmentBonuses(defender);
  let attackerHp = attacker.stats.hp;
  let defenderHp = defender.stats.hp;
  const log: CombatEvent[] = [];

  for (
    let turn = 1;
    turn <= MAX_TURNS && attackerHp > 0 && defenderHp > 0;
    turn++
  ) {
    const isAttackerTurn = turn % 2 === 1;
    const actor: 'attacker' | 'defender' = isAttackerTurn ? 'attacker' : 'defender';
    const current = isAttackerTurn ? attacker : defender;
    const targetStats = isAttackerTurn ? defender.stats : attacker.stats;

    const dodgeChance = Math.min(targetStats.agility / 100, 0.75);
    if (Math.random() < dodgeChance) {
      log.push({ turn, actor, action: 'dodge' });
      continue;
    }

    const isCritical = Math.random() < 0.1;
    const baseDamage = Math.max(1, current.stats.strength - Math.floor(targetStats.endurance / 2));
    const damage = isCritical ? Math.floor(baseDamage * 1.5) : baseDamage;

    if (isAttackerTurn) {
      defenderHp = Math.max(0, defenderHp - damage);
      log.push({
        turn,
        actor,
        action: isCritical ? 'critical' : 'attack',
        damage,
        defender_hp: defenderHp,
      });
    } else {
      attackerHp = Math.max(0, attackerHp - damage);
      log.push({
        turn,
        actor,
        action: isCritical ? 'critical' : 'attack',
        damage,
        attacker_hp: attackerHp,
      });
    }
  }

  const winner_id = attackerHp >= defenderHp ? attacker.id : defender.id;
  return { winner_id, log_data: log };
}
