import { Router, Response } from 'express';
import { supabase } from '../db/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (_req, res: Response) => {
  const { data, error } = await supabase
    .from('pets')
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
    .from('character_pets')
    .select('unlocked_at, pets(*)')
    .eq('character_id', char.id)
    .single();

  if (error || !data) { res.status(404).json({ error: 'No pet' }); return; }
  res.json(data);
});

export default router;
