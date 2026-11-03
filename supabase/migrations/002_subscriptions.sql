-- =====================================================================
-- Wisal  |  002  Wisal Plus subscriptions   (run SECOND)
-- Rows are written only by the wisal-pay-ipn Edge Function (service role).
-- =====================================================================
create table if not exists public.subscriptions (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  tier               text not null default 'free',      -- 'free' | 'plus'
  cycle              text,                               -- 'month' | 'year'
  status             text not null default 'inactive',   -- 'active' | 'inactive' | 'cancelled'
  method             text,                               -- 'bkash' | 'nagad' | 'card'
  last_tran          text,
  current_period_end timestamptz,
  updated_at         timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
drop policy if exists "read own subscription" on public.subscriptions;
create policy "read own subscription" on public.subscriptions for select to authenticated using (auth.uid() = user_id);
revoke all on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;
