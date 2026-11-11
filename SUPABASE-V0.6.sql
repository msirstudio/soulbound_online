-- SOULBOUND Online v0.6: race gacha persistence
alter table public.profiles add column if not exists race_id text not null default 'human', add column if not exists race_points integer not null default 0;
update public.profiles set race_id='human' where race_id is null;
update public.profiles set race_points=0 where race_points is null;
