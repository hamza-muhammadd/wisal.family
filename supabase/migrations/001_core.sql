-- =====================================================================
-- Wisal  |  001  core schema: family data, households, chat, media bucket
-- Run FIRST, in Supabase -> SQL Editor (paste the whole file, press Run).
-- Safe to run twice.
-- =====================================================================

-- ---------- tables --------------------------------------------------
-- One row per household owner. `data` is the whole family's app data.
create table if not exists public.family_data (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  data        jsonb       not null default '{}'::jsonb,
  invite_code text unique check (invite_code is null or char_length(invite_code) between 4 and 12),
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

-- Who belongs to whose household. A person belongs to at most one.
create table if not exists public.family_members (
  member_id    uuid primary key references auth.users(id) on delete cascade,
  household_id uuid not null references public.family_data(user_id) on delete cascade,
  joined_at    timestamptz not null default now()
);
create index if not exists family_members_household_idx on public.family_members(household_id);

create table if not exists public.family_messages (
  id           bigint generated always as identity primary key,
  household_id uuid not null references public.family_data(user_id) on delete cascade,
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author       text,
  body         text not null,
  created_at   timestamptz not null default now(),
  reply_to     bigint,
  edited_at    timestamptz,
  deleted      boolean not null default false,
  reactions    jsonb   not null default '{}'::jsonb
);
create index if not exists family_messages_house_time_idx on public.family_messages(household_id, created_at);

create table if not exists public.family_reads (
  household_id uuid not null references public.family_data(user_id) on delete cascade,
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  last_seen_id bigint not null default 0,
  updated_at   timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- ---------- helper: "am I the owner or a member of this household?" ----
create or replace function public.is_household_member(hid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select auth.uid() is not null and (
    auth.uid() = hid
    or exists (select 1 from public.family_members m
               where m.member_id = auth.uid() and m.household_id = hid)
  );
$$;

-- ---------- join with an invite code (the app calls this via rpc) -----
create or replace function public.join_household(code text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare hid uuid;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  select user_id into hid from public.family_data
   where invite_code = upper(btrim(code));
  if hid is null then return null; end if;
  if hid = auth.uid() then raise exception 'own_code'; end if;
  insert into public.family_members(member_id, household_id)
  values (auth.uid(), hid)
  on conflict (member_id) do update set household_id = excluded.household_id, joined_at = now();
  return hid;
end;
$$;

-- ---------- guards: members may edit shared data, never ownership ------
create or replace function public.family_data_guard()
returns trigger language plpgsql as $$
begin
  new.user_id    := old.user_id;
  new.created_at := old.created_at;
  if auth.uid() is not null and auth.uid() <> old.user_id then
    new.invite_code := old.invite_code;      -- only the owner can change the code
  end if;
  return new;
end;
$$;
drop trigger if exists family_data_guard on public.family_data;
create trigger family_data_guard before update on public.family_data
  for each row execute function public.family_data_guard();

create or replace function public.family_messages_guard()
returns trigger language plpgsql as $$
begin
  new.household_id := old.household_id;
  new.user_id      := old.user_id;
  new.created_at   := old.created_at;
  if auth.uid() is not null and auth.uid() <> old.user_id then
    -- other family members may only add reactions
    new.body := old.body; new.author := old.author;
    new.edited_at := old.edited_at; new.deleted := old.deleted; new.reply_to := old.reply_to;
  end if;
  return new;
end;
$$;
drop trigger if exists family_messages_guard on public.family_messages;
create trigger family_messages_guard before update on public.family_messages
  for each row execute function public.family_messages_guard();

-- ---------- row level security ---------------------------------------
alter table public.family_data     enable row level security;
alter table public.family_members  enable row level security;
alter table public.family_messages enable row level security;
alter table public.family_reads    enable row level security;

-- family_data
drop policy if exists fd_select on public.family_data;
drop policy if exists fd_insert on public.family_data;
drop policy if exists fd_update on public.family_data;
drop policy if exists fd_delete on public.family_data;
create policy fd_select on public.family_data for select to authenticated using (public.is_household_member(user_id));
create policy fd_insert on public.family_data for insert to authenticated with check (user_id = auth.uid());
create policy fd_update on public.family_data for update to authenticated
  using (public.is_household_member(user_id)) with check (public.is_household_member(user_id));
create policy fd_delete on public.family_data for delete to authenticated using (user_id = auth.uid());

-- family_members: read your own membership (or your household's list); leave / remove. Joining is only via join_household().
drop policy if exists fm_select on public.family_members;
drop policy if exists fm_delete on public.family_members;
create policy fm_select on public.family_members for select to authenticated
  using (member_id = auth.uid() or household_id = auth.uid());
create policy fm_delete on public.family_members for delete to authenticated
  using (member_id = auth.uid() or household_id = auth.uid());

-- family_messages
drop policy if exists fmsg_select on public.family_messages;
drop policy if exists fmsg_insert on public.family_messages;
drop policy if exists fmsg_update on public.family_messages;
drop policy if exists fmsg_delete on public.family_messages;
create policy fmsg_select on public.family_messages for select to authenticated using (public.is_household_member(household_id));
create policy fmsg_insert on public.family_messages for insert to authenticated
  with check (user_id = auth.uid() and public.is_household_member(household_id));
create policy fmsg_update on public.family_messages for update to authenticated
  using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
create policy fmsg_delete on public.family_messages for delete to authenticated
  using (user_id = auth.uid() or household_id = auth.uid());

-- family_reads
drop policy if exists fr_select on public.family_reads;
drop policy if exists fr_insert on public.family_reads;
drop policy if exists fr_update on public.family_reads;
create policy fr_select on public.family_reads for select to authenticated using (public.is_household_member(household_id));
create policy fr_insert on public.family_reads for insert to authenticated
  with check (user_id = auth.uid() and public.is_household_member(household_id));
create policy fr_update on public.family_reads for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_household_member(household_id));

-- ---------- explicit grants (signed-in users only, never anonymous) ----
revoke all on public.family_data, public.family_members, public.family_messages, public.family_reads from anon;
grant select, insert, update, delete on public.family_data, public.family_messages to authenticated;
grant select, delete on public.family_members to authenticated;
grant select, insert, update on public.family_reads to authenticated;
revoke all on function public.join_household(text) from public, anon;
grant execute on function public.join_household(text) to authenticated;
revoke all on function public.is_household_member(uuid) from public, anon;
grant execute on function public.is_household_member(uuid) to authenticated;

-- ---------- realtime (live chat, read receipts) ------------------------
do $$ begin
  begin alter publication supabase_realtime add table public.family_messages; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.family_reads;    exception when duplicate_object then null; end;
end $$;

-- ---------- chat photo / voice / file bucket ---------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('chat-media', 'chat-media', true, 15728640)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

drop policy if exists "chat-media upload to own folder" on storage.objects;
drop policy if exists "chat-media delete own files"     on storage.objects;
create policy "chat-media upload to own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "chat-media delete own files" on storage.objects for delete to authenticated
  using (bucket_id = 'chat-media' and (storage.foldername(name))[1] = auth.uid()::text);
