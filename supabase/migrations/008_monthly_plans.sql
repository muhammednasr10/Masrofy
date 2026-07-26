-- Monthly budget plans and category line items

create table public.monthly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_month date not null,
  planned_income numeric(12, 2) not null default 0 check (planned_income >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_month)
);

create index monthly_plans_user_id_month_idx
  on public.monthly_plans (user_id, plan_month desc);

alter table public.monthly_plans enable row level security;

create policy "Users can manage own monthly plans"
  on public.monthly_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.plan_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid not null references public.monthly_plans (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  planned_amount numeric(12, 2) not null default 0 check (planned_amount >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (plan_id, category_id)
);

create index plan_items_plan_id_idx on public.plan_items (plan_id, sort_order);

alter table public.plan_items enable row level security;

create policy "Users can manage own plan items"
  on public.plan_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
