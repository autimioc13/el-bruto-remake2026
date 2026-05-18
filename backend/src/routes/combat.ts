import { Router, Response } from 'express';
import { supabase } from '../db/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { simulateCombat } from '../engine/combat';
import { calculateXpGain, shouldLevelUp, applyStatIncrease, determineRewardType, getRankName } from '../engine/levelup';
import { Fighter, Skill, Weapon, Pet } from '../types';

const router = Router();

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { defender_id } = req.body;
  if (!defender_id) {
    res.status(400).json({ error: 'defender_id required' });
    return;
  }

  const { data: atk, error: aErr } = await supabase
    .from('characters')
    .select('*, character_skills(skill_id, skills(*))')
    .eq('user_id', req.userId!)
    .single();

  if (aErr || !atk) {
    res.status(404).json({ error: 'Your character not found' });
    return;
  }

  const { data: def, error: dErr } = await supabase
    .from('characters')
    .select('*, character_skills(skill_id, skills(*))')
    .eq('id', defender_id)
    .single();

  if (dErr || !def) {
    res.status(404).json({ error: 'Defender not found' });
    return;
  }

  if (atk.id === def.id) {
    res.status(400).json({ error: 'Cannot fight yourself' });
    return;
  }

  const { data: atkWeapon } = await supabase
    .from('character_weapons')
    .select('weapons(*)')
    .eq('character_id', atk.id)
    .eq('equipped', true)
    .single();

  const { data: defWeapon } = await supabase
    .from('character_weapons')
    .select('weapons(*)')
    .eq('character_id', def.id)
    .eq('equipped', true)
    .single();

  const { data: atkPet } = await supabase
    .from('character_pets')
    .select('pets(*)')
    .eq('character_id', atk.id)
    .single();

  const { data: defPet } = await supabase
    .from('character_pets')
    .select('pets(*)')
    .eq('character_id', def.id)
    .single();

  const toFighter = (char: any, weaponRow: any, petRow: any): Fighter => ({
    id: char.id,
    name: char.name,
    stats: char.stats,
    skills: (char.character_skills || []).map((cs: any) => cs.skills as Skill).filter(Boolean),
    weapon: (weaponRow as any)?.weapons ?? null,
    pet: (petRow as any)?.pets ?? null,
  });

  const result = simulateCombat(toFighter(atk, atkWeapon, atkPet), toFighter(def, defWeapon, defPet));
  const attackerWon = result.winner_id === atk.id;

  const { data: combatLog, error: logErr } = await supabase
    .from('combat_logs')
    .insert({
      attacker_id: atk.id,
      defender_id: def.id,
      winner_id: result.winner_id,
      attacker_name: atk.name,
      defender_name: def.name,
      log_data: result.log_data,
    })
    .select()
    .single();

  if (logErr) {
    res.status(500).json({ error: logErr.message });
    return;
  }

  await supabase.from('characters').update({
    wins: atk.wins + (attackerWon ? 1 : 0),
    losses: atk.losses + (attackerWon ? 0 : 1),
  }).eq('id', atk.id);

  await supabase.from('characters').update({
    wins: def.wins + (attackerWon ? 0 : 1),
    losses: def.losses + (attackerWon ? 1 : 0),
  }).eq('id', def.id);

  let levelUpUnlock: { type: string; label: string } | null = null;

  if (attackerWon) {
    const xpGain = calculateXpGain(atk.level, def.level);
    const withXp = { ...atk, xp: atk.xp + xpGain };

    if (shouldLevelUp(withXp)) {
      const { character: leveled, label } = applyStatIncrease(withXp);
      const rewardType = determineRewardType(leveled.level);
      const prevRank = getRankName(atk.level);
      const newRank = getRankName(leveled.level);

      await supabase.from('characters').update({
        xp: leveled.xp,
        level: leveled.level,
        xp_to_next_level: leveled.xp_to_next_level,
        stats: leveled.stats,
      }).eq('id', atk.id);

      levelUpUnlock = { type: 'stat', label };

      if (rewardType === 'weapon') {
        const { data: owned } = await supabase
          .from('character_weapons')
          .select('weapon_id')
          .eq('character_id', atk.id);
        const ownedIds = (owned || []).map((r: any) => r.weapon_id);

        const { data: available } = await supabase
          .from('weapons')
          .select('*')
          .lte('min_level', leveled.level)
          .not('id', 'in', ownedIds.length ? `(${ownedIds.join(',')})` : '(00000000-0000-0000-0000-000000000000)');

        if (available && available.length > 0) {
          const picked = available[Math.floor(Math.random() * available.length)] as Weapon;
          const isFirst = ownedIds.length === 0;
          await supabase.from('character_weapons').insert({
            character_id: atk.id,
            weapon_id: picked.id,
            equipped: isFirst,
          });
          levelUpUnlock = { type: 'weapon', label: `¡Nueva arma: ${picked.name} (${picked.rarity})!` };
        } else {
          levelUpUnlock = { type: 'stat', label };
        }
      } else if (rewardType === 'pet') {
        const { data: currentPet } = await supabase
          .from('character_pets')
          .select('pet_id, pets(evolves_to)')
          .eq('character_id', atk.id)
          .single();

        if (currentPet) {
          const evolvesTo = (currentPet as any).pets?.evolves_to;
          if (evolvesTo) {
            const { data: evolved } = await supabase.from('pets').select('*').eq('id', evolvesTo).single();
            if (evolved && leveled.level >= (evolved as Pet).min_level) {
              await supabase.from('character_pets').update({ pet_id: evolvesTo }).eq('character_id', atk.id);
              levelUpUnlock = { type: 'pet', label: `¡Mascota evolucionó: ${(evolved as Pet).name}!` };
            } else {
              levelUpUnlock = { type: 'stat', label };
            }
          } else {
            levelUpUnlock = { type: 'stat', label };
          }
        } else {
          const { data: available } = await supabase
            .from('pets')
            .select('*')
            .lte('min_level', leveled.level)
            .eq('evolution_stage', 1);

          if (available && available.length > 0) {
            const picked = available[Math.floor(Math.random() * available.length)] as Pet;
            await supabase.from('character_pets').insert({ character_id: atk.id, pet_id: picked.id });
            levelUpUnlock = { type: 'pet', label: `¡Nueva mascota: ${picked.name}!` };
          } else {
            levelUpUnlock = { type: 'stat', label };
          }
        }
      } else if (rewardType === 'skill') {
        const { data: charSkills } = await supabase
          .from('character_skills')
          .select('skill_id')
          .eq('character_id', atk.id);
        const ownedSkillIds = (charSkills || []).map((r: any) => r.skill_id);

        const { data: available } = await supabase
          .from('skills')
          .select('*')
          .not('id', 'in', ownedSkillIds.length ? `(${ownedSkillIds.join(',')})` : '(00000000-0000-0000-0000-000000000000)');

        if (available && available.length > 0) {
          const picked = available[Math.floor(Math.random() * available.length)];
          await supabase.from('character_skills').insert({ character_id: atk.id, skill_id: picked.id });
          levelUpUnlock = { type: 'skill', label: `¡Nueva habilidad: ${picked.name}!` };
        } else {
          levelUpUnlock = { type: 'stat', label };
        }
      }

      if (prevRank !== newRank) {
        levelUpUnlock = {
          ...levelUpUnlock!,
          label: levelUpUnlock!.label + ` | ¡Nuevo rango: ${newRank}!`,
        };
      }
    } else {
      await supabase.from('characters').update({ xp: withXp.xp }).eq('id', atk.id);
    }
  }

  res.json({
    combat_id: combatLog.id,
    winner_id: result.winner_id,
    attacker_name: atk.name,
    defender_name: def.name,
    log_data: result.log_data,
    level_up: levelUpUnlock,
  });
});

router.get('/:id', async (req, res: Response) => {
  const { data, error } = await supabase
    .from('combat_logs')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !data) {
    res.status(404).json({ error: 'Combat not found' });
    return;
  }

  const winner_name = data.winner_id === data.attacker_id ? data.attacker_name : data.defender_name;
  res.json({ ...data, winner_name });
});

export default router;
