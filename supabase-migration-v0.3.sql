-- SOULBOUND v0.3: add class and equipment persistence to existing profiles table.
alter table public.profiles
 add column if not exists class_id text not null default 'swordsman',
 add column if not exists mana_potions integer not null default 2,
 add column if not exists weapon text not null default 'Training Sword',
 add column if not exists armor text not null default 'Traveler Armor';