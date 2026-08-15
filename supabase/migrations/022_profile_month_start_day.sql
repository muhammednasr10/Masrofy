alter table public.profiles
add column if not exists month_start_day integer not null default 1
check (month_start_day >= 1 and month_start_day <= 28);
