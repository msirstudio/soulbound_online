-- SOULBOUND 0.57 — RUN ONLY after separately backing up existing profiles
-- and hero_save_slots, and before enabling 0.57 Secure Save on Render.
-- Does NOT remove old data or disable the old character tables.
--
-- The authoritative table is NOT writable directly from client JWTs.
-- Only the Render backend using the SUPABASE_SERVICE_ROLE_KEY may write.
create table if not exists public.hero_secure_saves(
 user_id uuid not null references auth.users(id) on delete cascade,
 slot smallint not null check (slot between 1 and 3),
 revision bigint not null default 0 check (revision>=0),
 data jsonb not null check (jsonb_typeof(data)='object'),
 updated_at timestamptz not null default now(),
 primary key(user_id,slot)
);
alter table public.hero_secure_saves enable row level security;
-- Explicitly revoke browser writes even when project-wide default privileges
-- may otherwise have granted them.
revoke all on public.hero_secure_saves from anon,authenticated,public;
grant select,insert,update,delete on public.hero_secure_saves to service_role;
-- Do not create permissive select/update policies on this table.
-- The Render server returns only records of an authenticated owner.

-- Import legacy Slot 1 ONCE, preserving current character properties.
-- Duplicates are left untouched, making repeated execution idempotent.
insert into public.hero_secure_saves(user_id,slot,data)
select p.id,1,to_jsonb(p)-'id' from public.profiles p
where p.class_id in ('swordsman','mage','tank')
on conflict(user_id,slot) do nothing;

-- Import legacy Slot 2 & 3, including inventories and world progress.
insert into public.hero_secure_saves(user_id,slot,data)
select hs.user_id,hs.slot,hs.data from public.hero_save_slots hs
where hs.slot in (2,3) and hs.data ? 'class_id'
on conflict(user_id,slot) do nothing;

-- Verify the number of imported rows (read only):
select slot,count(*) as character_saves from public.hero_secure_saves group by slot order by slot;

-- CAUTION: Old tables remain untouched for rollback. Their RLS was initially
-- owner-writable, but 0.57 Secure Save ignores edits to those legacy tables.
-- Do NOT share SUPABASE_SERVICE_ROLE_KEY or any sb_secret_ key in public/config.js.
