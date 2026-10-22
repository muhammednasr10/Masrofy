-- Confirmed vs contingent horizon plan lines.
-- Contingent amounts are kept for reference but excluded from totals/forecasts.

alter table public.horizon_plan_items
  add column if not exists certainty text not null default 'confirmed';

alter table public.horizon_plan_items
  drop constraint if exists horizon_plan_items_certainty_check;

alter table public.horizon_plan_items
  add constraint horizon_plan_items_certainty_check
  check (certainty in ('confirmed', 'contingent'));
