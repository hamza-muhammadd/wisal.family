-- =====================================================================
-- Wisal  |  003  free-AI daily limit   (run THIRD)
-- Used only by the wisal-ai Edge Function (service role). Browsers cannot touch it.
-- =====================================================================
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null default ((now() at time zone 'utc')::date),
  count   int  not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;      -- no policies: nobody but the server
revoke all on public.ai_usage from anon, authenticated;

-- Atomically add one use. Returns the new count, or -1 when the limit is already reached.
create or replace function public.ai_bump(p_user uuid, p_limit int)
returns int language plpgsql security definer set search_path = public as $$
declare c int;
begin
  insert into public.ai_usage(user_id, day, count)
  values (p_user, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day) do update set count = public.ai_usage.count + 1
    where public.ai_usage.count < p_limit
  returning count into c;
  return coalesce(c, -1);
end;
$$;
revoke all on function public.ai_bump(uuid, int) from public, anon, authenticated;
grant execute on function public.ai_bump(uuid, int) to service_role;
