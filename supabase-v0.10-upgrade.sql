-- SOULBOUND Online v0.10 upgrade
-- Run this AFTER the v0.9 upgrade in Supabase SQL Editor.
-- Adds persistent class specialization and six potion inventory tiers.
alter table public.profiles
  add column if not exists class_path text,
  add column if not exists small_health integer not null default 0,
  add column if not exists medium_health integer not null default 0,
  add column if not exists large_health integer not null default 0,
  add column if not exists small_mana integer not null default 0,
  add column if not exists medium_mana integer not null default 0,
  add column if not exists large_mana integer not null default 0;

-- Preserve existing v0.9 potion stock as small potions on first upgrade.
update public.profiles
set small_health = potions
where small_health = 0 and coalesce(potions, 0) > 0;

update public.profiles
set small_mana = mana_potions
where small_mana = 0 and coalesce(mana_potions, 0) > 0;
