-- SOULBOUND v0.40 — run ONCE in Supabase SQL Editor before testing new cloud saves.
-- Additive only: never drops or resets an existing character / inventory.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS world_progress jsonb NOT NULL
  DEFAULT '{"version":40,"defeatedBossIds":[],"bossDefeats":{}}'::jsonb;

COMMENT ON COLUMN public.profiles.world_progress IS
 'SOULBOUND v0.40 per-hero region clear counts; profile RLS policies remain unchanged.';

-- Optional verification:
-- SELECT id, level, world_progress FROM public.profiles LIMIT 5;
