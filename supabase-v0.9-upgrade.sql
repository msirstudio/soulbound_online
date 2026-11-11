-- SOULBOUND Online v0.9 profile upgrade
-- Run once in Supabase Dashboard > SQL Editor > New query.
-- Adds persistent stat allocation fields and relaxes legacy minimums that blocked New Game.
alter table public.profiles
  add column if not exists class_id text not null default 'swordsman',
  add column if not exists mana_potions integer not null default 2,
  add column if not exists weapon text not null default 'Training Sword',
  add column if not exists armor text not null default 'Traveler Armor',
  add column if not exists race_id text not null default 'human',
  add column if not exists race_points integer not null default 0,
  add column if not exists strength integer not null default 0,
  add column if not exists vitality integer not null default 0,
  add column if not exists intelligence integer not null default 0,
  add column if not exists agility integer not null default 0,
  add column if not exists stat_points integer not null default 0,
  add column if not exists speed integer not null default 10;

alter table public.profiles drop constraint if exists profiles_max_mp_check;
alter table public.profiles add constraint profiles_max_mp_check check (max_mp >= 1);
alter table public.profiles drop constraint if exists profiles_max_hp_check;
alter table public.profiles add constraint profiles_max_hp_check check (max_hp >= 1);
