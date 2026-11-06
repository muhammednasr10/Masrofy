-- Plan lines can continue with no end date.
-- Safe to run more than once in the Supabase SQL editor.

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
