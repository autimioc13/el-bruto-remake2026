import { Fighter, CombatResult, CombatEvent } from '../types';

const MAX_TURNS = 200;

export function simulateCombat(attacker: Fighter, defender: Fighter): CombatResult {
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
