-- Manual profit entries for variable investments (e.g. crypto)

create table public.investment_profit_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  investment_id uuid not null references public.investments (id) on delete cascade,
  profit_amount numeric(12, 2) not null,
  period_start date,
  period_end date not null,
  note text,
  created_at timestamptz not null default now()
);

create index investment_profit_entries_investment_id_idx
  on public.investment_profit_entries (investment_id, period_end desc);

alter table public.investment_profit_entries enable row level security;

create policy "Users can manage own investment profit entries"
  on public.investment_profit_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
