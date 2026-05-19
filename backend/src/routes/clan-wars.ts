import { Router, Response } from 'express';
import { supabase } from '../db/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Global clan war standings
router.get('/standings', async (_req, res: Response) => {
  const [warsRes, clansRes] = await Promise.all([
    supabase.from('clan_wars').select('clan_a_id, clan_b_id, wins_a, wins_b, total_battles'),
    supabase.from('clans').select('id, name, clan_members(count)'),
  ]);

  const wars = warsRes.data ?? [];
  const clans = clansRes.data ?? [];

  const warWins: Record<string, number> = {};
  const warBattles: Record<string, number> = {};

  for (const w of wars) {
    warWins[w.clan_a_id] = (warWins[w.clan_a_id] ?? 0) + w.wins_a;
    warWins[w.clan_b_id] = (warWins[w.clan_b_id] ?? 0) + w.wins_b;
    warBattles[w.clan_a_id] = (warBattles[w.clan_a_id] ?? 0) + w.total_battles;
    warBattles[w.clan_b_id] = (warBattles[w.clan_b_id] ?? 0) + w.total_battles;
  }

  const standings = clans
    .map(clan => ({
      id: clan.id,
      name: clan.name,
      members: (clan as any).clan_members?.[0]?.count ?? 0,
      war_wins: warWins[clan.id] ?? 0,
      war_battles: Math.round((warBattles[clan.id] ?? 0) / 2),
    }))
    .sort((a, b) => b.war_wins - a.war_wins || b.war_battles - a.war_battles);

  res.json(standings);
});

// Wars involving my clan
router.get('/mine', requireAuth, async (req: AuthRequest, res: Response) => {
  const { data: char } = await supabase
    .from('characters').select('id').eq('user_id', req.userId!).single();
  if (!char) { res.status(404).json({ error: 'No character' }); return; }

  const { data: member } = await supabase
    .from('clan_members').select('clan_id').eq('character_id', char.id).single();
  if (!member) { res.status(400).json({ error: 'Not in a clan' }); return; }

  const clanId = (member as any).clan_id;

  const { data: wars } = await supabase
    .from('clan_wars')
    .select('*, clan_a:clan_a_id(id, name), clan_b:clan_b_id(id, name)')
    .or(`clan_a_id.eq.${clanId},clan_b_id.eq.${clanId}`)
    .order('last_battle_at', { ascending: false });

  const enriched = (wars ?? []).map((w: any) => {
    const isA = w.clan_a_id === clanId;
    return {
      id: w.id,
      opponent: isA ? w.clan_b : w.clan_a,
      my_wins: isA ? w.wins_a : w.wins_b,
      their_wins: isA ? w.wins_b : w.wins_a,
      total_battles: w.total_battles,
      last_battle_at: w.last_battle_at,
    };
  });

  res.json({ clan_id: clanId, wars: enriched });
});

// Get a random attackable member from target clan
router.get('/target/:clanId', requireAuth, async (req: AuthRequest, res: Response) => {
  const { data: char } = await supabase
    .from('characters').select('id').eq('user_id', req.userId!).single();
  if (!char) { res.status(404).json({ error: 'No character' }); return; }

  const { data: members } = await supabase
    .from('clan_members')
    .select('character_id, characters(id, name)')
    .eq('clan_id', req.params.clanId)
    .neq('character_id', char.id);

  if (!members || members.length === 0) {
    res.status(400).json({ error: 'No hay miembros disponibles para atacar en este clan' });
    return;
  }

  const pick = members[Math.floor(Math.random() * members.length)] as any;
  res.json({ defender_id: pick.character_id, defender_name: pick.characters?.name ?? 'Desconocido' });
});

export default router;
