import { Router, Response } from 'express';
import { supabase } from '../db/supabase';

const router = Router();

router.get('/', async (_req, res: Response) => {
  const { data, error } = await supabase
    .from('characters')
    .select('id, name, level, wins, losses, stats, appearance')
    .order('level', { ascending: false })
    .order('wins', { ascending: false })
    .limit(50);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(data);
});

export default router;
