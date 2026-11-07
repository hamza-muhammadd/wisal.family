-- =====================================================================
-- Wisal  |  005  family core: roles, permissions, plans and limits, invitations
-- Stage 1 of the family-centric reform.   Run FIFTH.   Safe to run twice.
--
-- ADDITIVE ONLY. Nothing is dropped or moved. Every existing family keeps working:
--   * the family is still the row in family_data (family id = the owner's user id)
--   * everyone who already joined becomes an 'adult' (same access as today)
--   * the old 6-letter invite code still works
-- What is new, and enforced in the database (not just hidden in the screen):
--   * roles: owner (implicit), admin, adult, teen, child, guest   + per-member overrides
--   * a member can be suspended
--   * plans table with member limits you can edit (nothing is hard-coded)
--   * invitations with a role, an optional email, an expiry and a use limit
--   * the plan of a family can never be changed from a browser
-- =====================================================================

-- ---------- plans: limits and features live in a table you can edit ----------
create table if not exists public.plans (
  plan_key text primary key,
  name     text not null,
  limits   jsonb not null default '{}'::jsonb,      -- {"members": 6}   (missing key = unlimited)
  features jsonb not null default '{}'::jsonb,
  sort     int  not null default 0,
  active   boolean not null default true
);
alter table public.plans enable row level security;
drop policy if exists plans_read on public.plans;
create policy plans_read on public.plans for select to authenticated using (active);
revoke all on public.plans from anon, authenticated;
grant select on public.plans to authenticated;
-- Starting values are PROPOSALS. Edit them any time in Table Editor > plans. Re-running never overwrites your edits.
insert into public.plans(plan_key, name, limits, sort) values
  ('free',        'Free',        '{"members": 6}',  1),
  ('premium',     'Premium',     '{"members": 12}', 2),
  ('family_plus', 'Family Plus', '{"members": 25}', 3)
on conflict (plan_key) do nothing;

-- ---------- the family profile (the family is the central entity) ----------
alter table public.family_data
  add column if not exists name        text,
  add column if not exists description text,
  add column if not exists avatar_url  text,
  add column if not exists country     text,
  add column if not exists currency    text,
  add column if not exists timezone    text,
  add column if not exists settings    jsonb not null default '{}'::jsonb,
  add column if not exists plan_key    text  not null default 'free' references public.plans(plan_key),
  add column if not exists member_limit int;            -- optional override for one family (null = follow the plan)

-- ---------- roles, status and overrides for each member ----------
alter table public.family_members
  add column if not exists role        text not null default 'adult' check (role in ('admin','adult','teen','child','guest')),
  add column if not exists status      text not null default 'active' check (status in ('active','suspended')),
  add column if not exists permissions jsonb not null default '{}'::jsonb,
  add column if not exists invited_by  uuid references auth.users(id) on delete set null;

-- ---------- who am I in this family? ----------
create or replace function public.my_family_id() returns uuid
language sql stable security definer set search_path = public as $$
  select coalesce((select m.household_id from public.family_members m where m.member_id = auth.uid()), auth.uid());
$$;

create or replace function public.family_role(hid uuid) returns text
language sql stable security definer set search_path = public as $$
  select case
    when auth.uid() is null then null
    when auth.uid() = hid   then 'owner'
    else (select m.role from public.family_members m
           where m.member_id = auth.uid() and m.household_id = hid and m.status = 'active')
  end;
$$;

-- default permission of each role. One place to change the rules.
create or replace function public.role_default_permission(p_role text, p_perm text) returns boolean
language sql immutable as $$
  select case p_perm
    when 'data.read'        then p_role in ('owner','admin','adult')   -- the shared family data (finance, health, documents ...)
    when 'data.write'       then p_role in ('owner','admin','adult')
    when 'finance.view'     then p_role in ('owner','admin','adult')
    when 'health.view'      then p_role in ('owner','admin','adult')
    when 'chat.use'         then p_role in ('owner','admin','adult','teen','child')
    when 'requests.create'  then p_role in ('owner','admin','adult','teen','child')
    when 'requests.approve' then p_role in ('owner','admin')
    when 'members.manage'   then p_role in ('owner','admin')
    when 'family.manage'    then p_role in ('owner','admin')
    else false
  end;
$$;

-- can I do this in this family?  (role default, then the owner's per-member override)
create or replace function public.family_can(hid uuid, perm text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare r text; ov jsonb;
begin
  r := public.family_role(hid);
  if r is null then return false; end if;
  if r = 'owner' then return true; end if;
  select m.permissions -> perm into ov from public.family_members m where m.member_id = auth.uid() and m.household_id = hid;
  if ov is not null and jsonb_typeof(ov) = 'boolean' then
    if perm in ('members.manage','family.manage','requests.approve') then      -- management rights come from the role only
      return public.role_default_permission(r, perm);
    end if;
    return (ov #>> '{}')::boolean;
  end if;
  return public.role_default_permission(r, perm);
end;
$$;

-- anyone ACTIVE in the family (replaces the old check: suspended people lose access everywhere)
create or replace function public.is_household_member(hid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.family_role(hid) is not null;
$$;

-- ---------- limits come from the plan ----------
create or replace function public.family_member_limit(hid uuid) returns int
language sql stable security definer set search_path = public as $$
  select coalesce(fd.member_limit, nullif(p.limits ->> 'members', '')::int)
    from public.family_data fd join public.plans p on p.plan_key = fd.plan_key
   where fd.user_id = hid;
$$;
create or replace function public.family_member_count(hid uuid) returns int      -- owner + everyone who has a seat
language sql stable security definer set search_path = public as $$
  select 1 + count(*)::int from public.family_members where household_id = hid;
$$;

-- ---------- joining: the old code still works, now with limits and suspension ----------
create or replace function public.join_household(code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare hid uuid; cur public.family_members%rowtype; lim int;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  select user_id into hid from public.family_data where invite_code = upper(btrim(code));
  if hid is null then return null; end if;
  if hid = auth.uid() then raise exception 'own_code'; end if;
  select * into cur from public.family_members where member_id = auth.uid();
  if found and cur.household_id = hid then
    if cur.status = 'suspended' then raise exception 'suspended'; end if;
    return hid;
  end if;
  lim := public.family_member_limit(hid);
  if lim is not null and public.family_member_count(hid) >= lim then raise exception 'family_full'; end if;
  insert into public.family_members(member_id, household_id, role)
  values (auth.uid(), hid, 'adult')
  on conflict (member_id) do update
    set household_id = excluded.household_id, joined_at = now(), role = 'adult', status = 'active', permissions = '{}'::jsonb;
  return hid;
end;
$$;

-- ---------- invitations: a role, an optional email, an expiry, a use limit ----------
create table if not exists public.family_invitations (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.family_data(user_id) on delete cascade,
  code        text not null unique,
  role        text not null default 'adult' check (role in ('admin','adult','teen','child','guest')),
  email       text,
  max_uses    int  not null default 1 check (max_uses between 1 and 50),
  uses        int  not null default 0,
  status      text not null default 'pending' check (status in ('pending','accepted','revoked')),
  expires_at  timestamptz not null default (now() + interval '7 days'),
  invited_by  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz
);
create index if not exists family_invitations_family_idx on public.family_invitations(family_id);
alter table public.family_invitations enable row level security;
drop policy if exists finv_select on public.family_invitations;
create policy finv_select on public.family_invitations for select to authenticated using (public.family_can(family_id, 'members.manage'));
revoke all on public.family_invitations from anon, authenticated;
grant select on public.family_invitations to authenticated;          -- created / revoked / accepted only through the functions below

create or replace function public.create_invitation(p_role text default 'adult', p_email text default null, p_days int default 7, p_max_uses int default 1)
returns public.family_invitations
language plpgsql security definer set search_path = public as $$
declare fam uuid; inv public.family_invitations; c text; tries int := 0;
begin
  fam := public.my_family_id();
  if fam is null or not exists (select 1 from public.family_data where user_id = fam) then raise exception 'no_family'; end if;
  if not public.family_can(fam, 'members.manage') then raise exception 'not_allowed'; end if;
  if p_role not in ('admin','adult','teen','child','guest') then raise exception 'bad_role'; end if;
  if p_role = 'admin' and public.family_role(fam) <> 'owner' then raise exception 'owner_only'; end if;
  loop
    c := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
    begin
      insert into public.family_invitations(family_id, code, role, email, expires_at, max_uses)
      values (fam, c, p_role, nullif(lower(btrim(coalesce(p_email,''))), ''), now() + make_interval(days => greatest(1, least(coalesce(p_days,7), 30))), greatest(1, least(coalesce(p_max_uses,1), 50)))
      returning * into inv;
      return inv;
    exception when unique_violation then
      tries := tries + 1; if tries > 5 then raise exception 'try_again'; end if;
    end;
  end loop;
end;
$$;

create or replace function public.revoke_invitation(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare fam uuid;
begin
  select family_id into fam from public.family_invitations where id = p_id;
  if fam is null or not public.family_can(fam, 'members.manage') then raise exception 'not_allowed'; end if;
  update public.family_invitations set status = 'revoked' where id = p_id and status = 'pending';
end;
$$;

create or replace function public.accept_invitation(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare inv public.family_invitations%rowtype; cur public.family_members%rowtype; v_email text; lim int;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  select * into inv from public.family_invitations where code = upper(btrim(p_code)) for update;
  if not found then raise exception 'invite_invalid'; end if;
  if inv.status = 'revoked'    then raise exception 'invite_revoked'; end if;
  if inv.expires_at < now()    then raise exception 'invite_expired'; end if;
  if inv.uses >= inv.max_uses  then raise exception 'invite_used'; end if;
  if inv.family_id = auth.uid() then raise exception 'own_family'; end if;
  if inv.email is not null then
    select lower(email) into v_email from auth.users where id = auth.uid();
    if v_email is distinct from inv.email then raise exception 'wrong_email'; end if;
  end if;
  select * into cur from public.family_members where member_id = auth.uid();
  if found and cur.household_id = inv.family_id then
    if cur.status = 'suspended' then raise exception 'suspended'; end if;
    return inv.family_id;                                   -- already in: nothing is consumed
  end if;
  lim := public.family_member_limit(inv.family_id);
  if lim is not null and public.family_member_count(inv.family_id) >= lim then raise exception 'family_full'; end if;
  insert into public.family_members(member_id, household_id, role, invited_by)
  values (auth.uid(), inv.family_id, inv.role, inv.invited_by)
  on conflict (member_id) do update
    set household_id = excluded.household_id, role = excluded.role, status = 'active', permissions = '{}'::jsonb, invited_by = excluded.invited_by, joined_at = now();
  update public.family_invitations
     set uses = uses + 1, accepted_by = auth.uid(), accepted_at = now(),
         status = case when uses + 1 >= max_uses then 'accepted' else status end
   where id = inv.id;
  return inv.family_id;
end;
$$;

-- ---------- managing members (owner and admins) ----------
create or replace function public._member_target(p_member uuid) returns public.family_members
language plpgsql security definer set search_path = public as $$
declare fam uuid; t public.family_members;
begin
  fam := public.my_family_id();
  if not public.family_can(fam, 'members.manage') then raise exception 'not_allowed'; end if;
  select * into t from public.family_members where member_id = p_member and household_id = fam;
  if not found then raise exception 'not_a_member'; end if;
  if t.role = 'admin' and public.family_role(fam) <> 'owner' then raise exception 'owner_only'; end if;   -- admins cannot touch admins
  return t;
end;
$$;

create or replace function public.set_member_role(p_member uuid, p_role text) returns void
language plpgsql security definer set search_path = public as $$
declare t public.family_members;
begin
  if p_role not in ('admin','adult','teen','child','guest') then raise exception 'bad_role'; end if;
  t := public._member_target(p_member);
  if p_role = 'admin' and public.family_role(t.household_id) <> 'owner' then raise exception 'owner_only'; end if;
  update public.family_members set role = p_role, permissions = '{}'::jsonb where member_id = p_member;     -- a new role starts from its defaults
end;
$$;

create or replace function public.set_member_status(p_member uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('active','suspended') then raise exception 'bad_status'; end if;
  perform public._member_target(p_member);
  update public.family_members set status = p_status where member_id = p_member;
end;
$$;

create or replace function public.set_member_permissions(p_member uuid, p_perms jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare k text; v jsonb; clean jsonb := '{}'::jsonb;
begin
  perform public._member_target(p_member);
  for k, v in select * from jsonb_each(coalesce(p_perms, '{}'::jsonb)) loop
    if k not in ('data.read','data.write','finance.view','health.view','chat.use','requests.create') then raise exception 'bad_permission'; end if;
    if jsonb_typeof(v) <> 'boolean' then raise exception 'bad_permission'; end if;
    clean := clean || jsonb_build_object(k, v);
  end loop;
  update public.family_members set permissions = clean where member_id = p_member;
end;
$$;

create or replace function public.remove_member(p_member uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_member = auth.uid() then
    delete from public.family_members where member_id = auth.uid();     -- leaving is always allowed
  else
    perform public._member_target(p_member);
    delete from public.family_members where member_id = p_member;
  end if;
end;
$$;

-- ---------- one safe call for the screen: "who am I in my family?" ----------
create or replace function public.get_my_family() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', fd.user_id, 'name', fd.name, 'description', fd.description, 'avatar_url', fd.avatar_url,
    'country', fd.country, 'currency', fd.currency, 'timezone', fd.timezone, 'settings', fd.settings,
    'plan_key', fd.plan_key, 'member_limit', public.family_member_limit(fd.user_id), 'member_count', public.family_member_count(fd.user_id),
    'role', public.family_role(fd.user_id),
    'can', (select jsonb_object_agg(k, public.family_can(fd.user_id, k))
              from unnest(array['data.read','data.write','finance.view','health.view','chat.use','requests.create','requests.approve','members.manage','family.manage']) k))
  from public.family_data fd
  where fd.user_id = public.my_family_id() and public.family_role(fd.user_id) is not null;
$$;

-- ---------- guards: what a browser may never change ----------
create or replace function public.family_data_guard() returns trigger language plpgsql as $$
begin
  new.user_id := old.user_id; new.created_at := old.created_at;
  if auth.uid() is not null then
    new.plan_key := old.plan_key; new.member_limit := old.member_limit;               -- billing only (service role)
    if auth.uid() <> old.user_id then new.invite_code := old.invite_code; end if;      -- only the owner changes the code
    if not public.family_can(old.user_id, 'family.manage') then                        -- profile: owner and admins only
      new.name := old.name; new.description := old.description; new.avatar_url := old.avatar_url;
      new.country := old.country; new.currency := old.currency; new.timezone := old.timezone; new.settings := old.settings;
    end if;
  end if;
  return new;
end;
$$;
create or replace function public.family_data_insert_guard() returns trigger language plpgsql as $$
begin
  if auth.uid() is not null then new.plan_key := 'free'; new.member_limit := null; end if;   -- nobody starts on a paid plan from a browser
  return new;
end;
$$;
drop trigger if exists family_data_insert_guard on public.family_data;
create trigger family_data_insert_guard before insert on public.family_data for each row execute function public.family_data_insert_guard();

-- ---------- row level security now follows the permissions ----------
drop policy if exists fd_select on public.family_data;
drop policy if exists fd_update on public.family_data;
create policy fd_select on public.family_data for select to authenticated using (public.family_can(user_id, 'data.read'));
create policy fd_update on public.family_data for update to authenticated
  using (public.family_can(user_id, 'data.write')) with check (public.family_can(user_id, 'data.write'));

drop policy if exists fm_select on public.family_members;
create policy fm_select on public.family_members for select to authenticated
  using (member_id = auth.uid() or household_id = auth.uid() or public.family_can(household_id, 'members.manage'));

drop policy if exists fmsg_select on public.family_messages;
drop policy if exists fmsg_insert on public.family_messages;
drop policy if exists fmsg_update on public.family_messages;
create policy fmsg_select on public.family_messages for select to authenticated using (public.family_can(household_id, 'chat.use'));
create policy fmsg_insert on public.family_messages for insert to authenticated
  with check (user_id = auth.uid() and public.family_can(household_id, 'chat.use'));
create policy fmsg_update on public.family_messages for update to authenticated
  using (public.family_can(household_id, 'chat.use')) with check (public.family_can(household_id, 'chat.use'));

drop policy if exists fr_select on public.family_reads;
drop policy if exists fr_insert on public.family_reads;
drop policy if exists fr_update on public.family_reads;
create policy fr_select on public.family_reads for select to authenticated using (public.family_can(household_id, 'chat.use'));
create policy fr_insert on public.family_reads for insert to authenticated
  with check (user_id = auth.uid() and public.family_can(household_id, 'chat.use'));
create policy fr_update on public.family_reads for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.family_can(household_id, 'chat.use'));

-- ---------- who may call what ----------
revoke all on function public.my_family_id(), public.family_role(uuid), public.family_can(uuid, text),
  public.family_member_limit(uuid), public.family_member_count(uuid), public.join_household(text),
  public.create_invitation(text, text, int, int), public.revoke_invitation(uuid), public.accept_invitation(text),
  public._member_target(uuid), public.set_member_role(uuid, text), public.set_member_status(uuid, text),
  public.set_member_permissions(uuid, jsonb), public.remove_member(uuid), public.get_my_family() from public, anon;
grant execute on function public.my_family_id(), public.family_role(uuid), public.family_can(uuid, text),
  public.family_member_limit(uuid), public.family_member_count(uuid), public.join_household(text),
  public.create_invitation(text, text, int, int), public.revoke_invitation(uuid), public.accept_invitation(text),
  public.set_member_role(uuid, text), public.set_member_status(uuid, text),
  public.set_member_permissions(uuid, jsonb), public.remove_member(uuid), public.get_my_family() to authenticated;
revoke all on function public._member_target(uuid) from authenticated;   -- internal helper
