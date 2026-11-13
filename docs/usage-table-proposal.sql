-- PROPOSAL ONLY. NOT APPLIED. Review before running anything.
--
-- public.training_log_usage (Supabase project hvwakffluwvegedefoth) as read
-- on 2026-11-13, read-only:
--   * policy training_log_usage_insert_anon: INSERT for anon, WITH CHECK true
--   * PK (day, device_id, event, screen); CHECKs on event, screen, app
--   * BEFORE INSERT trigger training_log_usage_before_insert(): stamps day
--     and app (from the Origin header), drops repeats, and returns NULL once
--     the day already has 2,000 rows.
--
-- The problem (QA audit 2026-11, out of scope for the app PR):
--   1. Anyone holding the publishable key can insert with any random
--      device_id. Each new uuid is a new "device", so one script fills the
--      day's 2,000 rows in seconds.
--   2. The 2,000-row cap then silently drops every REAL count for the rest
--      of that day. The cap protects the table's size but turns flooding into
--      a denial of the club's statistics.
--   3. The cap is checked with count(*) over the whole day on every insert.
--
-- The proposal:
--   A. A per-source daily budget. The trigger keys a counter on a hash of
--      the client IP with a salt that changes every day, so the stored value
--      cannot be linked across days or reversed to an address. One source
--      may write at most 40 rows a day (a real device writes at most 11:
--      app_open, workout_logged and one screen_open per screen).
--   B. The global cap stays as a size backstop but rises (20,000) and is read
--      from a counter row instead of count(*).
--   C. Counter rows are deleted after 2 days.
--
-- PRIVACY NOTE: A stores a salted, daily-rotated hash of the IP for up to two
-- days. privacy.html and the Settings text currently say the IP is only in
-- the provider's request logs. If this is adopted, both must say so first.
--
-- The app does not change: it still POSTs to /rest/v1/training_log_usage.

begin;

create table if not exists public.training_log_usage_budget (
  day date not null,
  source text not null,          -- 'all' for the day total, else a salted hash
  n integer not null default 0,
  primary key (day, source)
);
alter table public.training_log_usage_budget enable row level security;
-- No policies: only the SECURITY DEFINER trigger below touches it.
revoke all on public.training_log_usage_budget from anon, authenticated;

create table if not exists public.training_log_usage_salt (
  day date primary key,
  salt bytea not null default extensions.gen_random_bytes(32)
);
alter table public.training_log_usage_salt enable row level security;
revoke all on public.training_log_usage_salt from anon, authenticated;

create or replace function public.training_log_usage_before_insert()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_origin text;
  v_headers json;
  v_ip text;
  v_salt bytea;
  v_source text;
  v_total integer;
  v_mine integer;
begin
  new.day := (now() at time zone 'Asia/Jerusalem')::date;
  begin
    v_headers := nullif(current_setting('request.headers', true), '')::json;
  exception when others then
    v_headers := null;
  end;
  v_origin := v_headers ->> 'origin';
  new.app := case v_origin
    when 'https://haimuniya.github.io' then 'old'
    when 'https://haimunia.pages.dev' then 'club'
    else 'unknown'
  end;

  -- A repeat is not a new row and costs no budget.
  if exists (
    select 1 from public.training_log_usage u
     where u.day = new.day and u.device_id = new.device_id
       and u.event = new.event and u.screen = new.screen
  ) then
    return null;
  end if;

  -- First address in x-forwarded-for is the client as Supabase's edge saw it.
  v_ip := coalesce(split_part(v_headers ->> 'x-forwarded-for', ',', 1), '');
  insert into public.training_log_usage_salt (day) values (new.day) on conflict do nothing;
  select s.salt into v_salt from public.training_log_usage_salt s where s.day = new.day;
  v_source := encode(extensions.digest(v_salt || convert_to(trim(v_ip), 'UTF8'), 'sha256'), 'hex');

  insert into public.training_log_usage_budget as b (day, source, n) values (new.day, v_source, 1)
    on conflict (day, source) do update set n = b.n + 1
    returning n into v_mine;
  if v_mine > 40 then
    return null;
  end if;

  insert into public.training_log_usage_budget as b (day, source, n) values (new.day, 'all', 1)
    on conflict (day, source) do update set n = b.n + 1
    returning n into v_total;
  if v_total > 20000 then
    return null;
  end if;

  return new;
end $function$;

-- Housekeeping: run daily (pg_cron), or fold into the existing 180-day
-- retention job.
--   delete from public.training_log_usage_budget where day < current_date - 2;
--   delete from public.training_log_usage_salt   where day < current_date - 2;

commit;
