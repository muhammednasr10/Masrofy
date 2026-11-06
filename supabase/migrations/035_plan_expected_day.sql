-- Day of the month a plan line is expected to happen.
-- Safe to run more than once in the Supabase SQL editor.

alter table public.horizon_plan_items
  add column if not exists expected_day smallint;

alter table public.horizon_plan_items
  drop constraint if exists horizon_plan_items_expected_day_check;

alter table public.horizon_plan_items
  add constraint horizon_plan_items_expected_day_check
  check (expected_day is null or expected_day between 1 and 31);
