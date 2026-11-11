-- SOULBOUND Online v0.12
-- Run once in Supabase SQL Editor.
alter table public.profiles
  add column if not exists inventory jsonb not null default '[]'::jsonb,
  add column if not exists weapon_item jsonb,
  add column if not exists armor_item jsonb,
  add column if not exists food_items jsonb not null default '{"roast_meat":0,"herb_stew":0,"mana_tart":0}'::jsonb,
  add column if not exists food_buffs jsonb not null default '{"atk":0,"def":0,"skill":0}'::jsonb;
