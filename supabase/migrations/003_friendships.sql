-- Masrofy friendships and wallet transfers

alter table public.profiles
  add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and (p.email is null or p.email <> u.email);

create type public.friendship_status as enum ('pending', 'accepted', 'declined', 'blocked');

create type public.relationship_type as enum ('friend', 'spouse', 'child', 'parent', 'sibling');

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  addressee_id uuid not null references auth.users (id) on delete cascade,
  status public.friendship_status not null default 'pending',
  relationship_type public.relationship_type not null default 'friend',
  requester_shares_activity boolean not null default false,
  addressee_shares_activity boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id)
);

create unique index friendships_unique_pair_idx
  on public.friendships (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  );

create index friendships_requester_idx on public.friendships (requester_id);
create index friendships_addressee_idx on public.friendships (addressee_id);

create table public.wallet_transfers (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users (id) on delete cascade,
  receiver_id uuid not null references auth.users (id) on delete cascade,
  sender_wallet_id uuid not null references public.wallets (id) on delete restrict,
  receiver_wallet_id uuid not null references public.wallets (id) on delete restrict,
  sender_wallet_name text not null,
  receiver_wallet_name text not null,
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

alter table public.transactions
  add column if not exists transfer_id uuid references public.wallet_transfers (id) on delete set null;

create index wallet_transfers_sender_idx on public.wallet_transfers (sender_id, created_at desc);
create index wallet_transfers_receiver_idx on public.wallet_transfers (receiver_id, created_at desc);

alter table public.friendships enable row level security;
alter table public.wallet_transfers enable row level security;

create policy "Users can view own friendships"
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Users can create friend requests"
  on public.friendships for insert
  with check (auth.uid() = requester_id);

create policy "Users can update own friendships"
  on public.friendships for update
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Users can delete own friendships"
  on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Users can view own transfers"
  on public.wallet_transfers for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;

create trigger on_auth_user_email_updated
  after insert or update of email on auth.users
  for each row execute function public.sync_profile_email();

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
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select p.id, p.full_name, p.email
  from public.profiles p
  where lower(p.email) = lower(trim(search_email))
    and p.id <> auth.uid()
  limit 1;
end;
$$;

revoke all on function public.find_user_by_email(text) from public;
grant execute on function public.find_user_by_email(text) to authenticated;

create or replace function public.are_users_friends(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.friendships f
    where f.status = 'accepted'
      and (
        (f.requester_id = user_a and f.addressee_id = user_b)
        or (f.requester_id = user_b and f.addressee_id = user_a)
      )
  );
$$;

create or replace function public.send_wallet_transfer(
  p_sender_wallet_id uuid,
  p_receiver_wallet_id uuid,
  p_amount numeric,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_id uuid := auth.uid();
  v_receiver_id uuid;
  v_sender_wallet public.wallets;
  v_receiver_wallet public.wallets;
  v_transfer_id uuid;
  v_sender_name text;
  v_receiver_name text;
begin
  if v_sender_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  select * into v_sender_wallet
  from public.wallets
  where id = p_sender_wallet_id
    and user_id = v_sender_id;

  if not found then
    raise exception 'Sender wallet not found';
  end if;

  select * into v_receiver_wallet
  from public.wallets
  where id = p_receiver_wallet_id;

  if not found then
    raise exception 'Receiver wallet not found';
  end if;

  v_receiver_id := v_receiver_wallet.user_id;

  if v_receiver_id = v_sender_id then
    raise exception 'Cannot transfer to yourself';
  end if;

  if not public.are_users_friends(v_sender_id, v_receiver_id) then
    raise exception 'You must be connected friends to transfer money';
  end if;

  select full_name into v_sender_name from public.profiles where id = v_sender_id;
  select full_name into v_receiver_name from public.profiles where id = v_receiver_id;

  insert into public.wallet_transfers (
    sender_id,
    receiver_id,
    sender_wallet_id,
    receiver_wallet_id,
    sender_wallet_name,
    receiver_wallet_name,
    amount,
    note
  )
  values (
    v_sender_id,
    v_receiver_id,
    p_sender_wallet_id,
    p_receiver_wallet_id,
    v_sender_wallet.name,
    v_receiver_wallet.name,
    p_amount,
    nullif(trim(p_note), '')
  )
  returning id into v_transfer_id;

  insert into public.transactions (
    user_id,
    wallet_id,
    amount,
    type,
    note,
    transaction_date,
    transfer_id
  )
  values
    (
      v_sender_id,
      p_sender_wallet_id,
      p_amount,
      'expense',
      coalesce(nullif(trim(p_note), ''), 'تحويل إلى ' || coalesce(v_receiver_name, 'صديق')),
      current_date,
      v_transfer_id
    ),
    (
      v_receiver_id,
      p_receiver_wallet_id,
      p_amount,
      'income',
      coalesce(nullif(trim(p_note), ''), 'تحويل من ' || coalesce(v_sender_name, 'صديق')),
      current_date,
      v_transfer_id
    );

  return v_transfer_id;
end;
$$;

revoke all on function public.send_wallet_transfer(uuid, uuid, numeric, text) from public;
grant execute on function public.send_wallet_transfer(uuid, uuid, numeric, text) to authenticated;

create or replace function public.get_friend_activity(p_friend_id uuid)
returns table (
  friend_id uuid,
  full_name text,
  relationship_type public.relationship_type,
  month_expenses numeric,
  month_income numeric,
  month_transactions bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_can_view boolean := false;
  v_relationship public.relationship_type;
  v_month_start date := date_trunc('month', current_date)::date;
  v_month_end date := (date_trunc('month', current_date) + interval '1 month - 1 day')::date;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select
    true,
    f.relationship_type
  into v_can_view, v_relationship
  from public.friendships f
  where f.status = 'accepted'
    and (
      (f.requester_id = v_user_id and f.addressee_id = p_friend_id and f.addressee_shares_activity)
      or (f.addressee_id = v_user_id and f.requester_id = p_friend_id and f.requester_shares_activity)
    )
  limit 1;

  if not coalesce(v_can_view, false) then
    raise exception 'Activity sharing is not enabled for this connection';
  end if;

  return query
  select
    p.id,
    p.full_name,
    v_relationship,
    coalesce(sum(case when t.type = 'expense' then t.amount else 0 end), 0),
    coalesce(sum(case when t.type = 'income' then t.amount else 0 end), 0),
    count(t.id)
  from public.profiles p
  left join public.transactions t
    on t.user_id = p.id
    and t.transaction_date between v_month_start and v_month_end
  where p.id = p_friend_id
  group by p.id, p.full_name;
end;
$$;

revoke all on function public.get_friend_activity(uuid) from public;
grant execute on function public.get_friend_activity(uuid) to authenticated;

create or replace function public.get_friend_wallets(p_friend_id uuid)
returns table (
  id uuid,
  name text,
  icon text,
  color text,
  is_default boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.are_users_friends(auth.uid(), p_friend_id) then
    raise exception 'You must be connected friends';
  end if;

  return query
  select w.id, w.name, w.icon, w.color, w.is_default
  from public.wallets w
  where w.user_id = p_friend_id
  order by w.is_default desc, w.name;
end;
$$;

revoke all on function public.get_friend_wallets(uuid) from public;
grant execute on function public.get_friend_wallets(uuid) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_wallet uuid;
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email);

  insert into public.categories (user_id, name, icon, color) values
    (new.id, 'طعام', '🍔', '#f97316'),
    (new.id, 'مواصلات', '🚗', '#3b82f6'),
    (new.id, 'فواتير', '💡', '#eab308'),
    (new.id, 'تسوق', '🛒', '#ec4899'),
    (new.id, 'صحة', '💊', '#22c55e'),
    (new.id, 'ترفيه', '🎬', '#a855f7'),
    (new.id, 'أخرى', '📦', '#64748b');

  insert into public.wallets (user_id, name, wallet_type, icon, color, is_default) values
    (new.id, 'بنك مصر', 'bank', '🏦', '#3b82f6', true),
    (new.id, 'بنك CIB', 'bank', '🏦', '#6366f1', false),
    (new.id, 'محفظة شخصية', 'cash', '💵', '#22c55e', false)
  returning id into default_wallet;

  update public.profiles
  set default_wallet_id = default_wallet
  where id = new.id;

  return new;
end;
$$;
