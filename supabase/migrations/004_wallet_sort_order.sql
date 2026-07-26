-- Wallet display order

alter table public.wallets
  add column if not exists sort_order integer not null default 0;

with ranked as (
  select
    id,
    row_number() over (
      partition by user_id
      order by is_default desc, name asc
    ) as position
  from public.wallets
)
update public.wallets w
set sort_order = ranked.position
from ranked
where w.id = ranked.id;

create index wallets_user_sort_idx on public.wallets (user_id, sort_order);
