-- Audit 2026-11, finding 23. NOT APPLIED. Review, then run once in the
-- Supabase SQL editor of the project in app-config.js.
--
-- Today the anon INSERT policy on public.training_log_usage is
-- WITH CHECK (true): any row the anon key can describe is accepted. This
-- replaces it with a check that admits only what src/usage.js actually sends:
--
--   device_id  a v4-style UUID string, 36 chars (usage.js deviceId())
--   event      one of app_open | workout_logged | screen_open (usage.js EVENTS)
--   screen     one of add | history | calendar | wod, and only with
--              screen_open; NULL for every other event (usage.js SCREENS)
--
-- RLS evaluates WITH CHECK per inserted row (Supabase docs, "Row Level
-- Security" -> INSERT policies), so a bad row is refused with a 401/403 and
-- the client already treats that as "not sent". The app needs no change.
--
-- What this does NOT do: limit how MANY valid rows someone sends. A policy
-- cannot rate-limit; that needs an Edge Function or a database trigger, and
-- is a separate decision.
--
-- device_id is compared as text, so this works whether the column is uuid
-- or text.

begin;

-- Drop every existing INSERT policy on the table (its name is not recorded
-- in this repository), then create the one below. Run inside this
-- transaction so the table is never left without a policy.
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'training_log_usage' and cmd = 'INSERT'
  loop
    execute format('drop policy %I on public.training_log_usage', p.policyname);
  end loop;
end $$;

create policy "anon inserts only what the app sends"
  on public.training_log_usage
  for insert
  to anon
  with check (
    device_id is not null
    and length(device_id::text) = 36
    and device_id::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    and event in ('app_open', 'workout_logged', 'screen_open')
    and (
      (event = 'screen_open' and screen in ('add', 'history', 'calendar', 'wod'))
      or (event <> 'screen_open' and screen is null)
    )
  );

commit;

-- Check afterwards:
--   select policyname, cmd, roles, with_check from pg_policies
--   where tablename = 'training_log_usage';
