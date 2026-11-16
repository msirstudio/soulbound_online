-- SOULBOUND v0.65 — ONE-TIME GLOBAL PLAYER-PROGRESS RESET
-- RUN MANUALLY IN SUPABASE SQL EDITOR ONLY AFTER verifying backups.
-- User authentication accounts in auth.users are deliberately PRESERVED.
-- Deletes all game progress in public.profiles, public.hero_save_slots,
-- and public.hero_secure_saves. This includes other players' save data.
-- The client/server also use the new save epoch rebirth-2026-11.
-- DO NOT put this SQL into server startup or deploy hooks.

BEGIN;
CREATE SCHEMA IF NOT EXISTS soulbound_admin;
REVOKE ALL ON SCHEMA soulbound_admin FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS soulbound_admin.reset_runs (
 reset_key text PRIMARY KEY,
 executed_at timestamptz NOT NULL DEFAULT now(),
 note text NOT NULL
);
DO $$
DECLARE
 key constant text := 'rebirth-2026-11';
BEGIN
 IF EXISTS (SELECT 1 FROM soulbound_admin.reset_runs WHERE reset_key=key) THEN
  RAISE EXCEPTION 'The reset % was already executed. Refusing to delete new players progress.', key;
 END IF;
 IF to_regclass('public.hero_secure_saves') IS NOT NULL THEN
  EXECUTE 'CREATE TABLE soulbound_admin.secure_saves_backup_20261116 AS TABLE public.hero_secure_saves';
  EXECUTE 'DELETE FROM public.hero_secure_saves';
 END IF;
 IF to_regclass('public.hero_save_slots') IS NOT NULL THEN
  EXECUTE 'CREATE TABLE soulbound_admin.hero_slots_backup_20261116 AS TABLE public.hero_save_slots';
  EXECUTE 'DELETE FROM public.hero_save_slots';
 END IF;
 IF to_regclass('public.profiles') IS NOT NULL THEN
  EXECUTE 'CREATE TABLE soulbound_admin.profiles_backup_20261116 AS TABLE public.profiles';
  EXECUTE 'DELETE FROM public.profiles';
 END IF;
 INSERT INTO soulbound_admin.reset_runs(reset_key,note)
 VALUES(key,'Fresh v0.65 game progression. Auth users preserved. Old game saves archived under soulbound_admin.');
END $$;
COMMIT;

-- Use these read-only checks AFTER the reset, for tables you installed:
-- SELECT COUNT(*) FROM public.hero_secure_saves;
-- SELECT COUNT(*) FROM public.hero_save_slots;
-- SELECT COUNT(*) FROM public.profiles;
-- SELECT COUNT(*) FROM auth.users; -- must NOT be changed by this script
-- For rollback: recover from the private soulbound_admin backup tables
-- with an account-verified one-time restore; do not rerun this script.
