-- Investment tracking

create type public.investment_type as enum (
  'stock',
  'gold',
  'crypto',
  'fund',
  'real_estate',
  'other'
);

create table public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  investment_type public.investment_type not null default 'other',
  icon text not null default '📈',
  color text not null default '#6366f1',
  cost_basis numeric(12, 2) not null default 0 check (cost_basis >= 0),
  current_value numeric(12, 2) not null default 0 check (current_value >= 0),
  quantity numeric(18, 6),
  unit_label text,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create index investments_user_id_idx on public.investments (user_id, sort_order);

alter table public.investments enable row level security;

create policy "Users can manage own investments"
  on public.investments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.investment_updates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  investment_id uuid not null references public.investments (id) on delete cascade,
  previous_value numeric(12, 2) not null,
  new_value numeric(12, 2) not null,
  note text,
  recorded_at timestamptz not null default now()
);

create index investment_updates_investment_id_idx
  on public.investment_updates (investment_id, recorded_at desc);

alter table public.investment_updates enable row level security;

create policy "Users can manage own investment updates"
  on public.investment_updates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
