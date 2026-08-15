-- Admin catalog + user category suggestions

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

update public.profiles
set is_admin = true
where lower(coalesce(email, '')) = 'muhammednasr10@gmail.com';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

grant execute on function public.is_admin() to authenticated;

create table if not exists public.default_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null default '📦',
  color text not null default '#6366f1',
  parent_name text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists default_categories_name_parent_idx
  on public.default_categories (lower(name), coalesce(parent_name, ''));

insert into public.default_categories (name, icon, color, parent_name, sort_order)
select v.name, v.icon, v.color, v.parent_name, v.sort_order
from (
  values
    ('طعام', '🍔', '#f97316', null::text, 1),
    ('مواصلات', '🚗', '#3b82f6', null, 2),
    ('فواتير', '💡', '#eab308', null, 3),
    ('تسوق', '🛒', '#ec4899', null, 4),
    ('صحة', '💊', '#22c55e', null, 5),
    ('ترفيه', '🎬', '#a855f7', null, 6),
    ('ادّخار', '🎯', '#10b981', null, 7),
    ('أخرى', '📦', '#64748b', null, 8)
) as v(name, icon, color, parent_name, sort_order)
where not exists (
  select 1
  from public.default_categories d
  where lower(d.name) = lower(v.name)
    and coalesce(d.parent_name, '') = coalesce(v.parent_name, '')
);

create table if not exists public.category_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  icon text not null default '📦',
  color text not null default '#6366f1',
  parent_name text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists category_suggestions_status_idx
  on public.category_suggestions (status, created_at desc);

create unique index if not exists category_suggestions_pending_unique_idx
  on public.category_suggestions (user_id, lower(name), coalesce(parent_name, ''))
  where status = 'pending';

alter table public.default_categories enable row level security;
alter table public.category_suggestions enable row level security;

drop policy if exists "Authenticated users can read default categories" on public.default_categories;
create policy "Authenticated users can read default categories"
  on public.default_categories for select
  to authenticated
  using (true);

drop policy if exists "Admins can manage default categories" on public.default_categories;
create policy "Admins can manage default categories"
  on public.default_categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Users can insert own category suggestions" on public.category_suggestions;
create policy "Users can insert own category suggestions"
  on public.category_suggestions for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can view own category suggestions" on public.category_suggestions;
create policy "Users can view own category suggestions"
  on public.category_suggestions for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Admins can update category suggestions" on public.category_suggestions;
create policy "Admins can update category suggestions"
  on public.category_suggestions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.queue_category_suggestion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_label text;
begin
  if new.name in ('مصروف غير معروف', 'إيراد غير معروف') then
    return new;
  end if;

  select name into parent_label
  from public.categories
  where id = new.parent_category_id;

  if exists (
    select 1
    from public.default_categories d
    where d.is_active
      and lower(d.name) = lower(new.name)
      and coalesce(d.parent_name, '') = coalesce(parent_label, '')
  ) then
    return new;
  end if;

  insert into public.category_suggestions (
    user_id,
    category_id,
    name,
    icon,
    color,
    parent_name
  )
  select
    new.user_id,
    new.id,
    new.name,
    new.icon,
    new.color,
    parent_label
  where not exists (
    select 1
    from public.category_suggestions s
    where s.user_id = new.user_id
      and s.status = 'pending'
      and lower(s.name) = lower(new.name)
      and coalesce(s.parent_name, '') = coalesce(parent_label, '')
  );

  return new;
end;
$$;

drop trigger if exists queue_category_suggestion_trigger on public.categories;
create trigger queue_category_suggestion_trigger
  after insert on public.categories
  for each row
  execute function public.queue_category_suggestion();

create or replace function public.review_category_suggestion(p_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.category_suggestions%rowtype;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  select * into rec
  from public.category_suggestions
  where id = p_id
  for update;

  if rec.id is null then
    raise exception 'not_found';
  end if;

  if rec.status <> 'pending' then
    raise exception 'already_reviewed';
  end if;

  if p_approve then
    if not exists (
      select 1
      from public.default_categories d
      where lower(d.name) = lower(rec.name)
        and coalesce(d.parent_name, '') = coalesce(rec.parent_name, '')
    ) then
      insert into public.default_categories (name, icon, color, parent_name, sort_order)
      values (
        rec.name,
        rec.icon,
        rec.color,
        rec.parent_name,
        (select coalesce(max(sort_order), 0) + 1 from public.default_categories)
      );
    end if;

    update public.category_suggestions
    set status = 'approved',
        reviewed_at = now(),
        reviewed_by = auth.uid()
    where id = p_id;
  else
    update public.category_suggestions
    set status = 'rejected',
        reviewed_at = now(),
        reviewed_by = auth.uid()
    where id = p_id;
  end if;
end;
$$;

grant execute on function public.review_category_suggestion(uuid, boolean) to authenticated;
