-- Run this in Supabase SQL Editor before deploying clan war features
CREATE TABLE IF NOT EXISTS clan_wars (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_a_id     UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  clan_b_id     UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  wins_a        INTEGER NOT NULL DEFAULT 0,
  wins_b        INTEGER NOT NULL DEFAULT 0,
  total_battles INTEGER NOT NULL DEFAULT 0,
  last_battle_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clan_wars_a ON clan_wars(clan_a_id);
CREATE INDEX IF NOT EXISTS idx_clan_wars_b ON clan_wars(clan_b_id);
