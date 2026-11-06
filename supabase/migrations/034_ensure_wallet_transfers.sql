-- Ensure internal wallet transfers work even if 017 was skipped or PostgREST lost the RPC.

alter type public.transaction_type add value if not exists 'transfer';

do $$
begin
  create type public.transfer_role as enum ('out', 'in');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.internal_wallet_transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  from_wallet_id uuid not null references public.wallets (id) on delete restrict,
  to_wallet_id uuid not null references public.wallets (id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  transaction_date date not null default current_date,
  created_at timestamptz not null default now(),
  check (from_wallet_id <> to_wallet_id)
);

create index if not exists internal_wallet_transfers_user_idx
  on public.internal_wallet_transfers (user_id, created_at desc);

alter table public.transactions
  add column if not exists internal_transfer_id uuid
    references public.internal_wallet_transfers (id) on delete set null,
  add column if not exists transfer_role public.transfer_role;

create index if not exists transactions_internal_transfer_idx
  on public.transactions (internal_transfer_id);

alter table public.internal_wallet_transfers enable row level security;

drop policy if exists "Users can manage own internal transfers" on public.internal_wallet_transfers;
create policy "Users can manage own internal transfers"
  on public.internal_wallet_transfers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- The new enum label cannot be validated in the same transaction that adds it.
set check_function_bodies = off;

create or replace function public.transfer_between_own_wallets(
  p_from_wallet_id uuid,
  p_to_wallet_id uuid,
  p_amount numeric,
  p_note text default null,
  p_transaction_date date default current_date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_from_wallet public.wallets;
  v_to_wallet public.wallets;
  v_transfer_id uuid;
  v_note text := nullif(trim(p_note), '');
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  if p_from_wallet_id = p_to_wallet_id then
    raise exception 'Cannot transfer to the same wallet';
  end if;

  select * into v_from_wallet
  from public.wallets
  where id = p_from_wallet_id
    and user_id = v_user_id;

  if not found then
    raise exception 'Source wallet not found';
  end if;

  select * into v_to_wallet
  from public.wallets
  where id = p_to_wallet_id
    and user_id = v_user_id;

  if not found then
    raise exception 'Destination wallet not found';
  end if;

  if v_from_wallet.wallet_type::text = 'investment' or v_to_wallet.wallet_type::text = 'investment' then
    raise exception 'Cannot transfer to or from investment wallets';
  end if;

  insert into public.internal_wallet_transfers (
    user_id,
    from_wallet_id,
    to_wallet_id,
    amount,
    note,
    transaction_date
  )
  values (
    v_user_id,
    p_from_wallet_id,
    p_to_wallet_id,
    p_amount,
    v_note,
    p_transaction_date
  )
  returning id into v_transfer_id;

  insert into public.transactions (
    user_id,
    wallet_id,
    amount,
    type,
    transfer_role,
    note,
    transaction_date,
    internal_transfer_id
  )
  values
    (
      v_user_id,
      p_from_wallet_id,
      p_amount,
      'transfer',
      'out',
      coalesce(v_note, 'تحويل إلى ' || v_to_wallet.name),
      p_transaction_date,
      v_transfer_id
    ),
    (
      v_user_id,
      p_to_wallet_id,
      p_amount,
      'transfer',
      'in',
      coalesce(v_note, 'تحويل من ' || v_from_wallet.name),
      p_transaction_date,
      v_transfer_id
    );

  return v_transfer_id;
end;
$$;

set check_function_bodies = on;

revoke all on function public.transfer_between_own_wallets(uuid, uuid, numeric, text, date) from public;
grant execute on function public.transfer_between_own_wallets(uuid, uuid, numeric, text, date) to authenticated;

notify pgrst, 'reload schema';
