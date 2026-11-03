-- Wisal Plus — subscriptions table
-- Run this once in Supabase → SQL Editor.

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

-- Each user may read ONLY their own subscription row (the app uses this to unlock Plus).
drop policy if exists "read own subscription" on public.subscriptions;
create policy "read own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);

-- No client-side insert/update/delete policies on purpose:
-- rows are written only by the wisal-pay-ipn Edge Function using the service-role key,
-- which bypasses RLS. That keeps "who is Plus" impossible to fake from the browser.
