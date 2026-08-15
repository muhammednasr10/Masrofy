-- Push subscriptions for due recurring notifications

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "Users can manage own push subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.due_push_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  recurring_id uuid not null references public.recurring_transactions (id) on delete cascade,
  due_date date not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, recurring_id, due_date)
);

alter table public.due_push_log enable row level security;
