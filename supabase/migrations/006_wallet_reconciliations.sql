-- Wallet inventory / reconciliation audit log

create type public.reconciliation_resolution as enum (
  'adjust_opening',
  'adjustment_tx',
  'log_only',
  'matched'
);

create table public.wallet_reconciliations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  wallet_id uuid not null references public.wallets (id) on delete cascade,
  recorded_balance numeric(12, 2) not null,
  actual_balance numeric(12, 2) not null,
  difference numeric(12, 2) not null,
  resolution public.reconciliation_resolution not null,
  adjustment_transaction_id uuid references public.transactions (id) on delete set null,
  note text,
  reconciled_at timestamptz not null default now()
);

create index wallet_reconciliations_user_id_idx
  on public.wallet_reconciliations (user_id, reconciled_at desc);

create index wallet_reconciliations_wallet_id_idx
  on public.wallet_reconciliations (wallet_id, reconciled_at desc);

alter table public.wallet_reconciliations enable row level security;

create policy "Users can manage own wallet reconciliations"
  on public.wallet_reconciliations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.reconcile_wallet(
  p_wallet_id uuid,
  p_actual_balance numeric,
  p_resolution public.reconciliation_resolution,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_wallet public.wallets%rowtype;
  v_tx_net numeric(12, 2) := 0;
  v_recorded numeric(12, 2);
  v_difference numeric(12, 2);
  v_resolution public.reconciliation_resolution;
  v_adjustment_id uuid;
  v_new_opening numeric(12, 2);
  v_reconciliation_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select * into v_wallet
  from public.wallets
  where id = p_wallet_id
    and user_id = v_user_id;

  if v_wallet.id is null then
    raise exception 'wallet not found';
  end if;

  select coalesce(sum(
    case when type = 'income' then amount else -amount end
  ), 0) into v_tx_net
  from public.transactions
  where wallet_id = p_wallet_id;

  if v_wallet.card_kind = 'credit' then
    v_recorded := v_wallet.opening_balance - v_tx_net;
  else
    v_recorded := v_wallet.opening_balance + v_tx_net;
  end if;

  v_difference := p_actual_balance - v_recorded;

  if abs(v_difference) < 0.005 then
    v_resolution := 'matched';
  else
    v_resolution := p_resolution;
  end if;

  if v_resolution = 'adjust_opening' and abs(v_difference) >= 0.005 then
    if v_wallet.card_kind = 'credit' then
      v_new_opening := p_actual_balance + v_tx_net;
    else
      v_new_opening := p_actual_balance - v_tx_net;
    end if;

    update public.wallets
    set opening_balance = v_new_opening
    where id = p_wallet_id;
  elsif v_resolution = 'adjustment_tx' and abs(v_difference) >= 0.005 then
    if v_wallet.card_kind = 'credit' then
      if v_difference > 0 then
        insert into public.transactions (user_id, wallet_id, amount, type, note, transaction_date)
        values (
          v_user_id,
          p_wallet_id,
          abs(v_difference),
          'expense',
          coalesce(nullif(trim(p_note), ''), 'تسوية جرد'),
          current_date
        )
        returning id into v_adjustment_id;
      else
        insert into public.transactions (user_id, wallet_id, amount, type, note, transaction_date)
        values (
          v_user_id,
          p_wallet_id,
          abs(v_difference),
          'income',
          coalesce(nullif(trim(p_note), ''), 'تسوية جرد'),
          current_date
        )
        returning id into v_adjustment_id;
      end if;
    else
      if v_difference > 0 then
        insert into public.transactions (user_id, wallet_id, amount, type, note, transaction_date)
        values (
          v_user_id,
          p_wallet_id,
          abs(v_difference),
          'income',
          coalesce(nullif(trim(p_note), ''), 'تسوية جرد'),
          current_date
        )
        returning id into v_adjustment_id;
      else
        insert into public.transactions (user_id, wallet_id, amount, type, note, transaction_date)
        values (
          v_user_id,
          p_wallet_id,
          abs(v_difference),
          'expense',
          coalesce(nullif(trim(p_note), ''), 'تسوية جرد'),
          current_date
        )
        returning id into v_adjustment_id;
      end if;
    end if;
  end if;

  insert into public.wallet_reconciliations (
    user_id,
    wallet_id,
    recorded_balance,
    actual_balance,
    difference,
    resolution,
    adjustment_transaction_id,
    note
  ) values (
    v_user_id,
    p_wallet_id,
    v_recorded,
    p_actual_balance,
    v_difference,
    v_resolution,
    v_adjustment_id,
    p_note
  )
  returning id into v_reconciliation_id;

  return v_reconciliation_id;
end;
$$;

grant execute on function public.reconcile_wallet(uuid, numeric, public.reconciliation_resolution, text)
  to authenticated;
