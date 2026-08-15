create or replace function public.reconcile_wallets_batch(
  p_items jsonb,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_item jsonb;
  v_wallet public.wallets%rowtype;
  v_wallet_id uuid;
  v_actual numeric(12, 2);
  v_tx_net numeric(12, 2);
  v_recorded numeric(12, 2);
  v_difference numeric(12, 2);
  v_net numeric(12, 2) := 0;
  v_target uuid;
  v_target_is_credit boolean := true;
  v_adjustment_id uuid;
  v_category_id uuid;
  v_tx_type public.transaction_type;
  v_tx_note text;
  v_resolution public.reconciliation_resolution;
  v_new_opening numeric(12, 2);
  v_reconciliation_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'no wallets to reconcile';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_wallet_id := (v_item->>'wallet_id')::uuid;
    v_actual := (v_item->>'actual_balance')::numeric;

    select * into v_wallet
    from public.wallets
    where id = v_wallet_id
      and user_id = v_user_id;

    if v_wallet.id is null then
      raise exception 'wallet not found';
    end if;

    v_tx_net := public.wallet_transaction_net(v_wallet_id);

    if v_wallet.card_kind = 'credit' then
      v_recorded := v_wallet.opening_balance - v_tx_net;
      v_difference := v_actual - v_recorded;
      v_net := v_net - v_difference;
    else
      v_recorded := v_wallet.opening_balance + v_tx_net;
      v_difference := v_actual - v_recorded;
      v_net := v_net + v_difference;
    end if;

    if v_target is null or (v_target_is_credit and v_wallet.card_kind is distinct from 'credit') then
      v_target := v_wallet_id;
      v_target_is_credit := v_wallet.card_kind = 'credit';
    end if;
  end loop;

  if abs(v_net) >= 0.005 then
    if v_net > 0 then
      v_tx_type := 'income';
      v_category_id := public.get_or_create_reconciliation_category(v_user_id, 'إيراد غير معروف', '📥');
      v_tx_note := coalesce(nullif(trim(p_note), ''), 'إيراد غير معروف — تحديث أرصدة المحافظ');
    else
      v_tx_type := 'expense';
      v_category_id := public.get_or_create_reconciliation_category(v_user_id, 'مصروف غير معروف', '📤');
      v_tx_note := coalesce(nullif(trim(p_note), ''), 'مصروف غير معروف — تحديث أرصدة المحافظ');
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
      v_target,
      v_category_id,
      abs(v_net),
      v_tx_type,
      v_tx_note,
      current_date
    )
    returning id into v_adjustment_id;
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_wallet_id := (v_item->>'wallet_id')::uuid;
    v_actual := (v_item->>'actual_balance')::numeric;

    select * into v_wallet
    from public.wallets
    where id = v_wallet_id
      and user_id = v_user_id;

    v_tx_net := public.wallet_transaction_net(v_wallet_id);

    if v_wallet.card_kind = 'credit' then
      v_recorded := v_wallet.opening_balance - v_tx_net;
    else
      v_recorded := v_wallet.opening_balance + v_tx_net;
    end if;

    v_difference := v_actual - v_recorded;

    if abs(v_difference) < 0.005 then
      v_resolution := 'matched';
    else
      v_resolution := 'adjust_opening';

      if v_wallet.card_kind = 'credit' then
        v_new_opening := v_actual + v_tx_net;
      else
        v_new_opening := v_actual - v_tx_net;
      end if;

      update public.wallets
      set opening_balance = v_new_opening
      where id = v_wallet_id;
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
      v_wallet_id,
      v_recorded,
      v_actual,
      v_difference,
      v_resolution,
      v_adjustment_id,
      p_note
    )
    returning id into v_reconciliation_id;
  end loop;

  return coalesce(v_adjustment_id, v_reconciliation_id);
end;
$$;

grant execute on function public.reconcile_wallets_batch(jsonb, text) to authenticated;
