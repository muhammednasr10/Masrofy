-- Debts and the payments that reduce them.
-- Safe to run more than once in the Supabase SQL editor.

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  direction text not null check (direction in ('i_owe', 'owed_to_me')),
  principal numeric(14, 2) not null check (principal > 0),
  category_id uuid references public.categories (id) on delete set null,
  wallet_id uuid references public.wallets (id) on delete set null,
  opened_on date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create unique index if not exists debts_user_category_unique
  on public.debts (user_id, category_id)
  where category_id is not null;

create index if not exists debts_user_id_idx
  on public.debts (user_id, created_at);

create table if not exists public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  debt_id uuid not null references public.debts (id) on delete cascade,
  transaction_id uuid references public.transactions (id) on delete set null,
  amount numeric(14, 2) not null check (amount > 0),
  paid_on date not null,
  created_at timestamptz not null default now()
);

create index if not exists debt_payments_debt_id_idx
  on public.debt_payments (debt_id, paid_on);

alter table public.debts enable row level security;
alter table public.debt_payments enable row level security;

drop policy if exists "Users can manage own debts" on public.debts;
create policy "Users can manage own debts"
  on public.debts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own debt payments" on public.debt_payments;
create policy "Users can manage own debt payments"
  on public.debt_payments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
