-- Collection frequency for fixed-return investments

create type public.collection_period as enum ('monthly', 'annual');

alter table public.investments
  add column if not exists collection_period public.collection_period default 'annual';

update public.investments
set collection_period = 'annual'
where is_fixed_return = true
  and collection_period is null;
