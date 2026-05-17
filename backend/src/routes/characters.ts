import { Router, Response } from 'express';
import { supabase } from '../db/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { Stats, Appearance } from '../types';

const router = Router();

function randomStats(): Stats {
  const roll = () => Math.floor(Math.random() * 6) + 5;
  return {
    hp: 80 + Math.floor(Math.random() * 40),
    strength: roll(),
    agility: roll(),
    endurance: roll(),
  };
}

async function enrichCharacter(char: any) {
  const { data: weaponRow } = await supabase
    .from('character_weapons')
    .select('equipped, weapons(*)')
    .eq('character_id', char.id)
    .eq('equipped', true)
    .single();

  const { data: petRow } = await supabase
    .from('character_pets')
    .select('pets(*)')
    .eq('character_id', char.id)
    .single();

  const { data: clanRow } = await supabase
    .from('clan_members')
    .select('role, clans(id, name)')
    .eq('character_id', char.id)
    .single();

  const level = char.level ?? 1;
  let rank = 'Bruto';
  if (level >= 25) rank = 'Cazador';
  else if (level >= 20) rank = 'Berserker';
  else if (level >= 15) rank = 'Monje';
  else if (level >= 10) rank = 'Asesino';
  else if (level >= 5) rank = 'Gladiador';

  return {
    ...char,
    rank,
    equipped_weapon: (weaponRow as any)?.weapons ?? null,
    pet: (petRow as any)?.pets ?? null,
    clan: (clanRow as any)?.clans ?? null,
  };
}

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, gender, hair_color, skin_color, hair_style } = req.body;

  if (!name || !gender) {
    res.status(400).json({ error: 'name and gender are required' });
    return;
  }

  const { data: existing } = await supabase
    .from('characters')
    .select('id')
    .eq('user_id', req.userId!)
    .single();

  if (existing) {
    res.status(409).json({ error: 'You already have a character' });
    return;
  }

  const appearance: Appearance = {
    gender: gender as 'male' | 'female',
    hair_color: hair_color || '#8B4513',
    skin_color: skin_color || '#FDBCB4',
    hair_style: hair_style || 'short',
  };

  const { data, error } = await supabase
    .from('characters')
    .insert({ user_id: req.userId!, name, stats: randomStats(), appearance })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json(data);
});

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('characters')
    .select('*, character_skills(skill_id, skills(*))')
    .eq('user_id', req.userId!)
    .single();

  if (error || !data) { res.status(404).json({ error: 'Character not found' }); return; }
  res.json(await enrichCharacter(data));
});

router.get('/:id', async (req, res: Response) => {
  const { data, error } = await supabase
    .from('characters')
    .select('*, character_skills(skill_id, skills(*))')
    .eq('id', req.params.id)
    .single();

  if (error || !data) { res.status(404).json({ error: 'Character not found' }); return; }
  res.json(await enrichCharacter(data));
});

export default router;
