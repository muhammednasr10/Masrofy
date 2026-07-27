alter table public.profiles
add column if not exists locale text not null default 'ar'
check (locale in ('ar', 'en'));
