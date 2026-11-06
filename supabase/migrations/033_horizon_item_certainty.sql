-- Confirmed vs contingent horizon plan lines.
-- Safe to run in the Supabase SQL editor even if 030 was never applied.

create table if not exists public.horizon_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.horizon_plans enable row level security;

drop policy if exists "Users can manage own horizon plans" on public.horizon_plans;
create policy "Users can manage own horizon plans"
  on public.horizon_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.horizon_plan_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid not null references public.horizon_plans (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  planned_amount numeric(14, 2) not null default 0 check (planned_amount >= 0),
  cadence text not null check (cadence in ('daily', 'weekly', 'monthly', 'yearly')),
  start_date date not null,
  end_date date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (plan_id, category_id),
  check (end_date is null or end_date >= start_date)
);

create index if not exists horizon_plan_items_plan_id_idx
  on public.horizon_plan_items (plan_id, sort_order);

alter table public.horizon_plan_items enable row level security;

drop policy if exists "Users can manage own horizon plan items" on public.horizon_plan_items;
create policy "Users can manage own horizon plan items"
  on public.horizon_plan_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.horizon_plan_items
  add column if not exists certainty text not null default 'confirmed';

alter table public.horizon_plan_items
  drop constraint if exists horizon_plan_items_certainty_check;

alter table public.horizon_plan_items
  add constraint horizon_plan_items_certainty_check
  check (certainty in ('confirmed', 'contingent'));

alter table public.horizon_plan_items
  add column if not exists expected_day smallint;

alter table public.horizon_plan_items
  drop constraint if exists horizon_plan_items_expected_day_check;

alter table public.horizon_plan_items
  add constraint horizon_plan_items_expected_day_check
  check (expected_day is null or expected_day between 1 and 31);

alter table public.horizon_plan_items
  alter column end_date drop not null;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'horizon_plan_items'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%end_date%'
      and pg_get_constraintdef(con.oid) not ilike '%expected_day%'
  loop
    execute format('alter table public.horizon_plan_items drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.horizon_plan_items
  drop constraint if exists horizon_plan_items_end_date_check;

alter table public.horizon_plan_items
  add constraint horizon_plan_items_end_date_check
  check (end_date is null or end_date >= start_date);
