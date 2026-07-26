-- Annual default plan template (applied to months, then customized per month)

create table public.annual_plan_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_year integer not null check (plan_year >= 2000 and plan_year <= 2100),
  planned_income numeric(12, 2) not null default 0 check (planned_income >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_year)
);

create index annual_plan_templates_user_year_idx
  on public.annual_plan_templates (user_id, plan_year desc);

alter table public.annual_plan_templates enable row level security;

create policy "Users can manage own annual plan templates"
  on public.annual_plan_templates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.annual_plan_template_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  template_id uuid not null references public.annual_plan_templates (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  planned_amount numeric(12, 2) not null default 0 check (planned_amount >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (template_id, category_id)
);

create index annual_plan_template_items_template_id_idx
  on public.annual_plan_template_items (template_id, sort_order);

alter table public.annual_plan_template_items enable row level security;

create policy "Users can manage own annual plan template items"
  on public.annual_plan_template_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
