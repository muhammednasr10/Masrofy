-- Masrofy MVP schema

create type public.transaction_type as enum ('expense', 'income');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  currency text not null default 'EGP',
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  icon text not null default '📦',
  color text not null default '#6366f1',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  type public.transaction_type not null default 'expense',
  note text,
  transaction_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index transactions_user_id_date_idx on public.transactions (user_id, transaction_date desc);
create index categories_user_id_idx on public.categories (user_id);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can manage own categories"
  on public.categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own transactions"
  on public.transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
