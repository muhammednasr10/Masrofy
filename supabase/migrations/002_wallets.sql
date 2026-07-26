-- Masrofy wallets MVP

create type public.wallet_type as enum ('bank', 'cash', 'wallet', 'card');

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  wallet_type public.wallet_type not null default 'bank',
  icon text not null default '🏦',
  color text not null default '#3b82f6',
  opening_balance numeric(12, 2) not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.profiles
  add column if not exists default_wallet_id uuid references public.wallets (id) on delete set null;

alter table public.transactions
  add column if not exists wallet_id uuid references public.wallets (id) on delete restrict;

create index wallets_user_id_idx on public.wallets (user_id);
create index transactions_wallet_id_idx on public.transactions (wallet_id);

create unique index wallets_one_default_per_user_idx
  on public.wallets (user_id)
  where is_default = true;

alter table public.wallets enable row level security;

create policy "Users can manage own wallets"
  on public.wallets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into public.wallets (user_id, name, wallet_type, icon, color, is_default)
select u.id, w.name, w.wallet_type, w.icon, w.color, w.is_default
from auth.users u
cross join (
  values
    ('بنك مصر', 'bank'::public.wallet_type, '🏦', '#3b82f6', true),
    ('بنك CIB', 'bank'::public.wallet_type, '🏦', '#6366f1', false),
    ('محفظة شخصية', 'cash'::public.wallet_type, '💵', '#22c55e', false)
) as w(name, wallet_type, icon, color, is_default)
where not exists (
  select 1 from public.wallets existing where existing.user_id = u.id
);

update public.transactions t
set wallet_id = w.id
from public.wallets w
where t.wallet_id is null
  and w.user_id = t.user_id
  and w.is_default = true;

update public.profiles p
set default_wallet_id = w.id
from public.wallets w
where p.default_wallet_id is null
  and w.user_id = p.id
  and w.is_default = true;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_wallet uuid;
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');

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
