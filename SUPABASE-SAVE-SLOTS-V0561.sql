-- SOULBOUND v0.56.1 · Install once in Supabase SQL Editor.
-- Existing public.profiles is NOT altered; it remains legacy Slot 1.
-- This new table stores independent account-linked Slots 2 and 3.
create table if not exists public.hero_save_slots (
 user_id uuid not null references auth.users(id) on delete cascade,
 slot smallint not null check (slot in (2,3)),
 data jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now(),
 primary key (user_id, slot)
);
alter table public.hero_save_slots enable row level security;
drop policy if exists "slot_select_self" on public.hero_save_slots;
drop policy if exists "slot_insert_self" on public.hero_save_slots;
drop policy if exists "slot_update_self" on public.hero_save_slots;
drop policy if exists "slot_delete_self" on public.hero_save_slots;
create policy "slot_select_self" on public.hero_save_slots for select to authenticated using (auth.uid() = user_id);
create policy "slot_insert_self" on public.hero_save_slots for insert to authenticated with check (auth.uid() = user_id);
create policy "slot_update_self" on public.hero_save_slots for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "slot_delete_self" on public.hero_save_slots for delete to authenticated using (auth.uid() = user_id);
grant select,insert,update,delete on public.hero_save_slots to authenticated;
