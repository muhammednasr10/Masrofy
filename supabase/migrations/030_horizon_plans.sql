-- One long-range expense plan per user.
-- Each category has its own amount, cadence, start date, and end date.

create table public.horizon_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.horizon_plans enable row level security;

create policy "Users can manage own horizon plans"
  on public.horizon_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.horizon_plan_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid not null references public.horizon_plans (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  planned_amount numeric(14, 2) not null default 0 check (planned_amount >= 0),
  cadence text not null check (cadence in ('daily', 'weekly', 'monthly', 'yearly')),
  start_date date not null,
  end_date date not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (plan_id, category_id),
  check (end_date >= start_date)
);

create index horizon_plan_items_plan_id_idx
  on public.horizon_plan_items (plan_id, sort_order);

alter table public.horizon_plan_items enable row level security;

create policy "Users can manage own horizon plan items"
  on public.horizon_plan_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
