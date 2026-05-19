import { Router, Response } from 'express';
import { supabase } from '../db/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/daily', requireAuth, async (req: AuthRequest, res: Response) => {
  const { data: char } = await supabase
    .from('characters')
    .select('id')
    .eq('user_id', req.userId!)
    .single();

  if (!char) { res.status(404).json({ error: 'Character not found' }); return; }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const [fightsRes, winsRes] = await Promise.all([
    supabase
      .from('combat_logs')
      .select('*', { count: 'exact', head: true })
      .or(`attacker_id.eq.${char.id},defender_id.eq.${char.id}`)
      .gte('created_at', todayISO),
    supabase
      .from('combat_logs')
      .select('*', { count: 'exact', head: true })
      .eq('winner_id', char.id)
      .gte('created_at', todayISO),
  ]);

  const fights = fightsRes.count ?? 0;
  const wins = winsRes.count ?? 0;

  const missions = [
    {
      id: 'fight_1',
      name: 'Entra al arena',
      desc: 'Participa en 1 combate hoy',
      goal: 1,
      progress: Math.min(fights, 1),
      reward: '+50 XP',
      icon: 'sword',
    },
    {
      id: 'win_1',
      name: 'Primera victoria del día',
      desc: 'Gana 1 combate hoy',
      goal: 1,
      progress: Math.min(wins, 1),
      reward: '+75 XP',
      icon: 'trophy',
    },
    {
      id: 'fight_3',
      name: 'Guerrero del día',
      desc: 'Participa en 3 combates hoy',
      goal: 3,
      progress: Math.min(fights, 3),
      reward: '+150 XP',
      icon: 'sword',
    },
    {
      id: 'win_3',
      name: 'Conquistador',
      desc: 'Gana 3 combates hoy',
      goal: 3,
      progress: Math.min(wins, 3),
      reward: '+250 XP',
      icon: 'trophy',
    },
  ];

  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  res.json({ missions, reset_at: tomorrow.toISOString() });
});

export default router;
