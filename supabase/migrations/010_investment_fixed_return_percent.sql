-- Store fixed return as percentage of principal

alter table public.investments
  add column if not exists fixed_return_percent numeric(8, 4)
    check (fixed_return_percent is null or fixed_return_percent >= 0);

update public.investments
set fixed_return_percent = round((fixed_profit / cost_basis) * 100, 4)
where is_fixed_return = true
  and fixed_profit is not null
  and cost_basis > 0
  and fixed_return_percent is null;

alter table public.investments
  drop column if exists fixed_profit;
