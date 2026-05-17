import { Router, Response } from 'express';
import { supabase } from '../db/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (_req, res: Response) => {
  const { data, error } = await supabase
    .from('weapons')
    .select('*')
    .order('min_level', { ascending: true });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

router.get('/mine', requireAuth, async (req: AuthRequest, res: Response) => {
  const { data: char } = await supabase
    .from('characters')
    .select('id')
    .eq('user_id', req.userId!)
    .single();

  if (!char) { res.status(404).json({ error: 'Character not found' }); return; }

  const { data, error } = await supabase
    .from('character_weapons')
    .select('id, equipped, unlocked_at, weapons(*)')
    .eq('character_id', char.id)
    .order('unlocked_at', { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

router.post('/equip', requireAuth, async (req: AuthRequest, res: Response) => {
  const { weapon_id } = req.body;
  if (!weapon_id) { res.status(400).json({ error: 'weapon_id required' }); return; }

  const { data: char } = await supabase
    .from('characters')
    .select('id')
    .eq('user_id', req.userId!)
    .single();

  if (!char) { res.status(404).json({ error: 'Character not found' }); return; }

  const { data: owned } = await supabase
    .from('character_weapons')
    .select('id')
    .eq('character_id', char.id)
    .eq('weapon_id', weapon_id)
    .single();

  if (!owned) { res.status(403).json({ error: 'You do not own this weapon' }); return; }

  await supabase
    .from('character_weapons')
    .update({ equipped: false })
    .eq('character_id', char.id);

  await supabase
    .from('character_weapons')
    .update({ equipped: true })
    .eq('character_id', char.id)
    .eq('weapon_id', weapon_id);

  res.json({ success: true });
});

export default router;
