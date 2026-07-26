-- Recurring transactions (subscriptions, rent, salary, etc.)

create type public.recurring_frequency as enum ('weekly', 'monthly', 'yearly');

create table public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  wallet_id uuid not null references public.wallets (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  type public.transaction_type not null default 'expense',
  note text,
  frequency public.recurring_frequency not null default 'monthly',
  start_date date not null,
  next_due_date date not null,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (next_due_date >= start_date),
  check (end_date is null or end_date >= start_date)
);

create index recurring_transactions_user_active_due_idx
  on public.recurring_transactions (user_id, is_active, next_due_date);

alter table public.transactions
  add column if not exists recurring_transaction_id uuid
  references public.recurring_transactions (id) on delete set null;

create index transactions_recurring_id_idx
  on public.transactions (recurring_transaction_id)
  where recurring_transaction_id is not null;

alter table public.recurring_transactions enable row level security;

create policy "Users can manage own recurring transactions"
  on public.recurring_transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
