-- Allow typing month start day 1–31, and optionally link it to a category event.

alter table public.profiles
  drop constraint if exists profiles_month_start_day_check;

alter table public.profiles
  add constraint profiles_month_start_day_check
  check (month_start_day >= 1 and month_start_day <= 31);

alter table public.profiles
  add column if not exists month_start_mode text not null default 'fixed'
    check (month_start_mode in ('fixed', 'category'));

alter table public.profiles
  add column if not exists month_start_category_id uuid
    references public.categories (id) on delete set null;

create index if not exists profiles_month_start_category_id_idx
  on public.profiles (month_start_category_id)
  where month_start_category_id is not null;
