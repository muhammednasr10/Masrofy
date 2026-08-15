create or replace function public.wallet_transaction_net(p_wallet_id uuid)
returns numeric
language sql
stable
as $$
  select coalesce(sum(
    case
      when type = 'income' then amount
      when type = 'expense' then -amount
      when type = 'transfer' and transfer_role = 'in' then amount
      when type = 'transfer' then -amount
      else 0
    end
  ), 0)
  from public.transactions
  where wallet_id = p_wallet_id;
$$;

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
  v_category_id uuid;
  v_tx_type public.transaction_type;
  v_tx_note text;
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

  v_tx_net := public.wallet_transaction_net(p_wallet_id);

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
        v_tx_type := 'expense';
        v_category_id := public.get_or_create_reconciliation_category(v_user_id, 'مصروف غير معروف', '📤');
        v_tx_note := coalesce(nullif(trim(p_note), ''), 'مصروف غير معروف — تحديث رصيد');
      else
        v_tx_type := 'income';
        v_category_id := public.get_or_create_reconciliation_category(v_user_id, 'إيراد غير معروف', '📥');
        v_tx_note := coalesce(nullif(trim(p_note), ''), 'إيراد غير معروف — تحديث رصيد');
      end if;
    else
      if v_difference > 0 then
        v_tx_type := 'income';
        v_category_id := public.get_or_create_reconciliation_category(v_user_id, 'إيراد غير معروف', '📥');
        v_tx_note := coalesce(nullif(trim(p_note), ''), 'إيراد غير معروف — تحديث رصيد');
      else
        v_tx_type := 'expense';
        v_category_id := public.get_or_create_reconciliation_category(v_user_id, 'مصروف غير معروف', '📤');
        v_tx_note := coalesce(nullif(trim(p_note), ''), 'مصروف غير معروف — تحديث رصيد');
      end if;
    end if;

    insert into public.transactions (
      user_id,
      wallet_id,
      category_id,
      amount,
      type,
      note,
      transaction_date
    )
    values (
      v_user_id,
      p_wallet_id,
      v_category_id,
      abs(v_difference),
      v_tx_type,
      v_tx_note,
      current_date
    )
    returning id into v_adjustment_id;
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

grant execute on function public.wallet_transaction_net(uuid) to authenticated;
grant execute on function public.reconcile_wallet(uuid, numeric, public.reconciliation_resolution, text)
  to authenticated;
