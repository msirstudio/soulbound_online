-- SOULBOUND v0.56.5 SECURE CHARACTER DATA
-- RUN ONLY AFTER BACKING UP public.profiles and public.hero_save_slots.
-- Apply this script BEFORE enabling SOULBOUND_SECURE_SAVES_ENABLED on Render.
-- Does not delete or modify old saved rows; imports them lazily upon sign-in.

create table if not exists public.hero_state_v0565 (
 user_id uuid not null references auth.users(id) on delete cascade,
 slot smallint not null check (slot between 1 and 3),
 revision bigint not null default 1 check (revision >= 1),
 character jsonb not null,
 updated_at timestamptz not null default now(),
 primary key (user_id, slot)
);
alter table public.hero_state_v0565 enable row level security;
-- No direct authenticated-client update/insert/delete permissions are granted.
revoke all on public.hero_state_v0565 from anon, authenticated, public;
-- Optional read-only access for the owner (the game uses server RPC instead).
grant select on public.hero_state_v0565 to authenticated;
drop policy if exists "v0565_owner_select" on public.hero_state_v0565;
create policy "v0565_owner_select" on public.hero_state_v0565
 for select to authenticated using (auth.uid() = user_id);

create or replace function public.secure_hero_commit_v0565(
 p_user_id uuid,p_slot integer,p_expected_revision bigint,p_character jsonb
) returns table(new_revision bigint)
 language plpgsql security definer set search_path=public,pg_temp as $$
declare n bigint;
begin
 if auth.role() is distinct from 'service_role' then
   raise exception 'Server-only secure save endpoint' using errcode='42501';
 end if;
 if p_slot not between 1 and 3 or p_expected_revision < 0 or
    p_character is null or jsonb_typeof(p_character) <> 'object' then
   raise exception 'Invalid slot/revision/character' using errcode='22023';
 end if;
 if pg_column_size(p_character)>1048576 then
   raise exception 'Character payload too large' using errcode='22023';
 end if;
 if p_expected_revision=0 then
  insert into public.hero_state_v0565(user_id,slot,revision,character)
   values(p_user_id,p_slot,1,p_character)
   on conflict do nothing returning revision into n;
 else
  update public.hero_state_v0565
   set character=p_character,revision=revision+1,updated_at=now()
   where user_id=p_user_id and slot=p_slot and revision=p_expected_revision
   returning revision into n;
 end if;
 if n is null then
  raise exception 'revision_conflict: save changed in another session'
    using errcode='40001';
 end if;
 return query select n;
end;$$;
revoke all on function public.secure_hero_commit_v0565(uuid,integer,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.secure_hero_commit_v0565(uuid,integer,bigint,jsonb) to service_role;

-- IMPORTANT rollout gate:
-- After all live clients have switched to the secure server save channel,
-- revoke old direct browser writes. Do this only in a maintenance window:
-- REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM authenticated;
-- REVOKE INSERT, UPDATE, DELETE ON public.hero_save_slots FROM authenticated;
-- Leaving old browser-writing permissions enabled is NOT full anti-cheat
-- because clients can still mutate legacy rows before they are migrated.
