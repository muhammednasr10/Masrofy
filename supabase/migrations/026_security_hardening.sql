-- Security hardening: related profile visibility + rate-limited friend email lookup

create or replace function public.users_are_connected(viewer_id uuid, target_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select viewer_id = target_id
    or exists (
      select 1
      from public.friendships f
      where f.status in ('pending', 'accepted')
        and (
          (f.requester_id = viewer_id and f.addressee_id = target_id)
          or (f.addressee_id = viewer_id and f.requester_id = target_id)
        )
    )
    or exists (
      select 1
      from public.wallet_transfers t
      where (t.sender_id = viewer_id and t.receiver_id = target_id)
         or (t.receiver_id = viewer_id and t.sender_id = target_id)
    );
$$;

revoke all on function public.users_are_connected(uuid, uuid) from public;
grant execute on function public.users_are_connected(uuid, uuid) to authenticated;

drop policy if exists "Users can view related profiles" on public.profiles;
create policy "Users can view related profiles"
  on public.profiles for select
  to authenticated
  using (public.users_are_connected(auth.uid(), id));

-- Keep own-profile policy for clarity; related policy covers self too.
-- Drop duplicate if both fire (OR of policies is fine). Leave "Users can view own profile".

create table if not exists public.friend_email_lookups (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  looked_up_at timestamptz not null default now()
);

create index if not exists friend_email_lookups_user_recent_idx
  on public.friend_email_lookups (user_id, looked_up_at desc);

alter table public.friend_email_lookups enable row level security;
-- No client policies: only security definer functions write lookup rows.

create or replace function public.find_user_by_email(search_email text)
returns table (
  id uuid,
  full_name text,
  email text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(trim(coalesce(search_email, '')));
  v_recent integer;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if v_email = '' or position('@' in v_email) = 0 then
    return;
  end if;

  select count(*)::integer into v_recent
  from public.friend_email_lookups
  where user_id = v_uid
    and looked_up_at > now() - interval '1 hour';

  if v_recent >= 10 then
    raise exception 'rate_limited';
  end if;

  insert into public.friend_email_lookups (user_id)
  values (v_uid);

  return query
  select p.id, p.full_name, p.email
  from public.profiles p
  where lower(p.email) = v_email
    and p.id <> v_uid
  limit 1;
end;
$$;

revoke all on function public.find_user_by_email(text) from public;
grant execute on function public.find_user_by_email(text) to authenticated;

-- Prevent clients from elevating themselves to admin
create or replace function public.prevent_is_admin_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
    and new.is_admin is distinct from old.is_admin
    and auth.uid() is not null
    and not public.is_admin()
  then
    new.is_admin := old.is_admin;
  end if;

  if tg_op = 'INSERT'
    and coalesce(new.is_admin, false)
    and auth.uid() is not null
    and not public.is_admin()
  then
    new.is_admin := false;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_is_admin_self_update_trigger on public.profiles;
create trigger prevent_is_admin_self_update_trigger
  before insert or update on public.profiles
  for each row
  execute function public.prevent_is_admin_self_update();
