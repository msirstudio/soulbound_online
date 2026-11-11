-- SOULBOUND Online v0.2 character persistence
-- Run this entire file in Supabase Dashboard > SQL Editor > New query.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null default 'Adventurer',
  level integer not null default 1 check (level between 1 and 999),
  xp integer not null default 0 check (xp >= 0),
  gold bigint not null default 0 check (gold >= 0),
  hp integer not null default 120 check (hp >= 0),
  max_hp integer not null default 120 check (max_hp >= 120),
  mp integer not null default 40 check (mp >= 0),
  max_mp integer not null default 40 check (max_mp >= 40),
  attack integer not null default 20 check (attack >= 20),
  defense integer not null default 8 check (defense >= 8),
  potions integer not null default 3 check (potions >= 0),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Players can read their own profile" on public.profiles;
create policy "Players can read their own profile"
on public.profiles for select to authenticated
using (auth.uid() = id);

drop policy if exists "Players can create their own profile" on public.profiles;
create policy "Players can create their own profile"
on public.profiles for insert to authenticated
with check (auth.uid() = id);

drop policy if exists "Players can update their own profile" on public.profiles;
create policy "Players can update their own profile"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

grant select, insert, update on public.profiles to authenticated;
