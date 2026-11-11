-- SOULBOUND v0.3: add class, mana potion and equipment persistence to existing profiles.
-- Safe to run on the existing v0.2 profiles table.
alter table public.profiles
 add column if not exists class_id text not null default 'swordsman',
 add column if not exists mana_potions integer not null default 2,
 add column if not exists weapon text not null default 'Training Sword',
 add column if not exists armor text not null default 'Traveler Armor';
-- Give legacy level-1 accounts a small starting purse for the new merchant.
update public.profiles set gold=80 where gold=0 and level=1 and xp=0;