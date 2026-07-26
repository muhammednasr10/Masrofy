-- Sub-wallets (e.g. debit/credit cards under a bank) + credit card fields

create type public.card_kind as enum ('debit', 'credit');

alter table public.wallets
  add column if not exists parent_wallet_id uuid references public.wallets (id) on delete cascade,
  add column if not exists card_kind public.card_kind,
  add column if not exists credit_limit numeric(12, 2);

alter table public.wallets
  drop constraint if exists wallets_user_id_name_key;

create unique index if not exists wallets_top_level_name_idx
  on public.wallets (user_id, name)
  where parent_wallet_id is null;

create unique index if not exists wallets_sub_wallet_name_idx
  on public.wallets (user_id, parent_wallet_id, name)
  where parent_wallet_id is not null;

create index if not exists wallets_parent_wallet_id_idx
  on public.wallets (parent_wallet_id);

alter table public.wallets
  add constraint wallets_credit_limit_non_negative_chk
  check (credit_limit is null or credit_limit >= 0);

create or replace function public.validate_wallet_hierarchy()
returns trigger
language plpgsql
as $$
declare
  parent_row public.wallets%rowtype;
begin
  if new.parent_wallet_id is not null then
    if new.card_kind is null then
      raise exception 'card_kind is required for sub-wallets';
    end if;

    select * into parent_row
    from public.wallets
    where id = new.parent_wallet_id;

    if parent_row.id is null then
      raise exception 'parent wallet not found';
    end if;

    if parent_row.user_id <> new.user_id then
      raise exception 'parent wallet must belong to the same user';
    end if;

    if parent_row.parent_wallet_id is not null then
      raise exception 'sub-wallets cannot be nested';
    end if;
  else
    if new.card_kind is not null then
      raise exception 'card_kind is only allowed for sub-wallets';
    end if;

    if new.credit_limit is not null then
      raise exception 'credit_limit is only allowed for credit sub-wallets';
    end if;
  end if;

  if new.card_kind is distinct from 'credit' and new.credit_limit is not null then
    raise exception 'credit_limit is only allowed for credit sub-wallets';
  end if;

  return new;
end;
$$;

drop trigger if exists wallets_validate_hierarchy on public.wallets;

create trigger wallets_validate_hierarchy
  before insert or update on public.wallets
  for each row
  execute function public.validate_wallet_hierarchy();
