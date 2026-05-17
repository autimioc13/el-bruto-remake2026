import { Router, Response } from 'express';
import { supabase } from '../db/supabase';

const router = Router();

router.get('/', async (_req, res: Response) => {
  const { data, error } = await supabase
    .from('characters')
    .select('id, name, level, wins, losses, appearance, clan_members(clans(id, name))')
    .order('level', { ascending: false })
    .order('wins', { ascending: false })
    .limit(50);

  if (error) { res.status(500).json({ error: error.message }); return; }

  const withRank = (data ?? []).map((c: any) => {
    let rank = 'Bruto';
    const lvl = c.level;
    if (lvl >= 25) rank = 'Cazador';
    else if (lvl >= 20) rank = 'Berserker';
    else if (lvl >= 15) rank = 'Monje';
    else if (lvl >= 10) rank = 'Asesino';
    else if (lvl >= 5) rank = 'Gladiador';
    return {
      ...c,
      rank,
      clan: c.clan_members?.[0]?.clans ?? null,
      clan_members: undefined,
    };
  });

  res.json(withRank);
});

export default router;
