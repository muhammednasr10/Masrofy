-- Fixed-return investments with collection date

alter table public.investments
  add column if not exists is_fixed_return boolean not null default false,
  add column if not exists fixed_profit numeric(12, 2) check (fixed_profit is null or fixed_profit >= 0),
  add column if not exists collection_date date;

create index investments_collection_date_idx
  on public.investments (user_id, collection_date)
  where is_fixed_return = true and collection_date is not null;
