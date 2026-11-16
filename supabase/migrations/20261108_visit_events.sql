-- Fed for a Fiver · 08/11/2026 · "Were you at X?", price check and About this place.
-- Run once in Supabase → SQL Editor. Holds only a random phone ID, a place ID, the answer and the date:
-- never a name, an email, a phone number or a position.

create table if not exists public.visit_events (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  device_id  text not null check (char_length(device_id) between 8 and 64),
  place_id   text not null check (char_length(place_id) between 1 and 200),
  action     text not null check (action in (
    'visit_yes_eat','visit_yes_takeaway','visit_no',
    'price_same','price_diff','price_skip',
    'seat_sit_in','seat_takeaway','seat_both',
    'tables_few','tables_lots',
    'vibe_quiet','vibe_lively'))
);
create index if not exists visit_events_device_idx on public.visit_events (device_id);
create index if not exists visit_events_place_idx  on public.visit_events (place_id);

-- The phone can only add rows. It cannot read, change or delete them.
alter table public.visit_events enable row level security;
drop policy if exists "anon insert visit_events" on public.visit_events;
create policy "anon insert visit_events" on public.visit_events
  for insert to anon with check (true);
revoke select, update, delete on public.visit_events from anon, authenticated;
grant insert on public.visit_events to anon;

-- Stats are read only with the service key (SQL Editor or a stats function), never from the phone.
create or replace view public.visit_stats with (security_invoker = true) as
  select place_id, action, count(*) as n, count(distinct device_id) as phones,
         min(created_at)::date as first_day, max(created_at)::date as last_day
  from public.visit_events group by place_id, action;
revoke all on public.visit_stats from anon, authenticated;

-- 12 months, then deleted (visits and the anonymous app counts). Needs the pg_cron extension
-- (Database → Extensions → pg_cron → Enable). Runs every day at 03:17 UTC.
create extension if not exists pg_cron;
select cron.unschedule('fiver-12-months') where exists (select 1 from cron.job where jobname = 'fiver-12-months');
select cron.schedule('fiver-12-months', '17 3 * * *', $$
  delete from public.visit_events where created_at < now() - interval '12 months';
  delete from public.events       where created_at < now() - interval '12 months';
$$);
