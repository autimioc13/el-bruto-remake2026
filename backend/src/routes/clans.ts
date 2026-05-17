import { Router, Response } from 'express';
import { supabase } from '../db/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (_req, res: Response) => {
  const { data, error } = await supabase
    .from('clans')
    .select('*, clan_members(count)')
    .order('total_wins', { ascending: false })
    .limit(50);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, description } = req.body;
  if (!name) { res.status(400).json({ error: 'name required' }); return; }

  const { data: char } = await supabase
    .from('characters')
    .select('id')
    .eq('user_id', req.userId!)
    .single();

  if (!char) { res.status(404).json({ error: 'Character not found' }); return; }

  const { data: existing } = await supabase
    .from('clan_members')
    .select('clan_id')
    .eq('character_id', char.id)
    .single();

  if (existing) { res.status(409).json({ error: 'You already belong to a clan' }); return; }

  const { data: clan, error: cErr } = await supabase
    .from('clans')
    .insert({ name, description: description || '', leader_id: char.id })
    .select()
    .single();

  if (cErr) { res.status(400).json({ error: cErr.message }); return; }

  await supabase.from('clan_members').insert({
    character_id: char.id,
    clan_id: clan.id,
    role: 'leader',
  });

  res.status(201).json(clan);
});

router.get('/:id', async (req, res: Response) => {
  const { data: clan, error } = await supabase
    .from('clans')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !clan) { res.status(404).json({ error: 'Clan not found' }); return; }

  const { data: members } = await supabase
    .from('clan_members')
    .select('role, joined_at, characters(id, name, level, wins, appearance)')
    .eq('clan_id', req.params.id)
    .order('joined_at', { ascending: true });

  res.json({ ...clan, members: members || [] });
});

router.post('/:id/join', requireAuth, async (req: AuthRequest, res: Response) => {
  const { data: char } = await supabase
    .from('characters')
    .select('id')
    .eq('user_id', req.userId!)
    .single();

  if (!char) { res.status(404).json({ error: 'Character not found' }); return; }

  const { data: existing } = await supabase
    .from('clan_members')
    .select('clan_id')
    .eq('character_id', char.id)
    .single();

  if (existing) { res.status(409).json({ error: 'You already belong to a clan' }); return; }

  const { data: clan } = await supabase
    .from('clans')
    .select('id')
    .eq('id', req.params.id)
    .single();

  if (!clan) { res.status(404).json({ error: 'Clan not found' }); return; }

  await supabase.from('clan_members').insert({
    character_id: char.id,
    clan_id: clan.id,
    role: 'member',
  });

  res.json({ success: true });
});

router.post('/leave', requireAuth, async (req: AuthRequest, res: Response) => {
  const { data: char } = await supabase
    .from('characters')
    .select('id')
    .eq('user_id', req.userId!)
    .single();

  if (!char) { res.status(404).json({ error: 'Character not found' }); return; }

  await supabase.from('clan_members').delete().eq('character_id', char.id);
  res.json({ success: true });
});

export default router;
