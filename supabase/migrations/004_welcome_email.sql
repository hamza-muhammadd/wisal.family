-- =====================================================================
-- Wisal  |  004  automatic Welcome email   (run FOURTH)
-- Before running: Database -> Extensions -> enable  pg_net
-- After running:  create the two Vault secrets shown at the bottom (once).
-- Safe to run twice. A failure here can NEVER block a sign-up (see the exception handler).
-- =====================================================================

-- One row per account that was (or will be) welcomed. Primary key = no duplicates, ever.
create table if not exists public.welcome_emails (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending','sending','sent','failed')),
  attempts    int  not null default 0,
  provider_id text,                       -- Resend message id (not a secret)
  last_error  text,                       -- short reason when it failed (never a token)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  sent_at     timestamptz
);
alter table public.welcome_emails enable row level security;       -- no policies: only the server touches it
revoke all on public.welcome_emails from anon, authenticated;

-- Fires once, the moment an account is created, so the welcome goes out together with the confirmation email.
create or replace function public.wisal_welcome_on_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  n int; v_secret text; v_url text;
begin
  if new.email is null then return new; end if;     -- only people who signed up with an email

  insert into public.welcome_emails(user_id) values (new.id) on conflict (user_id) do nothing;
  get diagnostics n = row_count;
  if n = 0 then return new; end if;                 -- already welcomed (or in progress): do nothing

  -- From here on, any problem is written onto the row (so you can see and retry it) and the sign-up carries on.
  begin
    select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'wisal_welcome_secret' limit 1;
    select decrypted_secret into v_url    from vault.decrypted_secrets where name = 'wisal_welcome_url'    limit 1;
    if v_secret is null or v_url is null then
      raise exception 'Vault secrets wisal_welcome_secret / wisal_welcome_url are missing';
    end if;
    perform net.http_post(
      url     := v_url,
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
      body    := jsonb_build_object('user_id', new.id),
      timeout_milliseconds := 5000
    );
  exception when others then
    update public.welcome_emails
       set status = 'failed', last_error = left(sqlerrm, 300), updated_at = now()
     where user_id = new.id;
  end;
  return new;
exception when others then
  return new;                                        -- last resort: email must never block account creation
end;
$$;
revoke all on function public.wisal_welcome_on_user() from public, anon, authenticated;

drop trigger if exists wisal_welcome_on_user on auth.users;
create trigger wisal_welcome_on_user
  after insert on auth.users
  for each row execute function public.wisal_welcome_on_user();

-- ---------------------------------------------------------------------
-- ONE-TIME SETUP (run these two lines separately, with YOUR values; do not commit them anywhere):
--   select vault.create_secret('PUT-A-LONG-RANDOM-STRING-HERE', 'wisal_welcome_secret');
--   select vault.create_secret('https://<your-project-ref>.supabase.co/functions/v1/wisal-welcome', 'wisal_welcome_url');
-- The random string must be identical to the Edge Function secret WELCOME_WEBHOOK_SECRET.
-- ---------------------------------------------------------------------
