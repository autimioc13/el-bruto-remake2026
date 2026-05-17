import { Router, Response } from 'express';
import { supabase } from '../db/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { simulateCombat } from '../engine/combat';
import { calculateXpGain, shouldLevelUp, applyLevelUp } from '../engine/levelup';
import { Fighter, Skill } from '../types';

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

  const toFighter = (char: any): Fighter => ({
    id: char.id,
    name: char.name,
    stats: char.stats,
    skills: (char.character_skills || []).map((cs: any) => cs.skills as Skill).filter(Boolean),
  });

  const result = simulateCombat(toFighter(atk), toFighter(def));
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

  let levelUpReward: string | null = null;

  if (attackerWon) {
    const xpGain = calculateXpGain(atk.level, def.level);
    const withXp = { ...atk, xp: atk.xp + xpGain };
    if (shouldLevelUp(withXp)) {
      const { character: leveled, reward } = applyLevelUp(withXp);
      levelUpReward = reward;
      await supabase.from('characters').update({
        xp: leveled.xp,
        level: leveled.level,
        xp_to_next_level: leveled.xp_to_next_level,
        stats: leveled.stats,
      }).eq('id', atk.id);
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
    level_up: levelUpReward,
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

  res.json(data);
});

export default router;
