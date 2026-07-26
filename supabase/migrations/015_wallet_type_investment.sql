-- Investment wallet type linked to investments page

alter type public.wallet_type add value if not exists 'investment';

alter table public.wallets
  add column if not exists investment_id uuid references public.investments (id) on delete set null;

create unique index if not exists wallets_investment_id_idx
  on public.wallets (investment_id)
  where investment_id is not null;

create or replace function public.validate_wallet_hierarchy()
returns trigger
language plpgsql
as $$
declare
  parent_row public.wallets%rowtype;
begin
  if new.wallet_type = 'investment' and new.parent_wallet_id is not null then
    raise exception 'investment wallets cannot be sub-wallets';
  end if;

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
