-- Let wallet balance updates pick a known income/expense category per difference.
-- Safe to run more than once in the Supabase SQL editor.

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
  v_adjustment_id uuid;
  v_last_id uuid;
  v_category_id uuid;
  v_requested_category uuid;
  v_category_flow public.category_flow;
  v_tx_type public.transaction_type;
  v_tx_note text;
  v_resolution public.reconciliation_resolution;
  v_is_income boolean;
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
    v_requested_category := nullif(v_item->>'category_id', '')::uuid;
    v_adjustment_id := null;

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
    else
      v_recorded := v_wallet.opening_balance + v_tx_net;
    end if;

    v_difference := v_actual - v_recorded;

    if abs(v_difference) < 0.005 then
      v_resolution := 'matched';
    else
      v_resolution := 'adjustment_tx';

      if v_wallet.card_kind = 'credit' then
        v_is_income := v_difference < 0;
      else
        v_is_income := v_difference > 0;
      end if;

      if v_is_income then
        v_tx_type := 'income';
      else
        v_tx_type := 'expense';
      end if;

      if v_requested_category is not null then
        select id, flow into v_category_id, v_category_flow
        from public.categories
        where id = v_requested_category
          and user_id = v_user_id;

        if v_category_id is null then
          raise exception 'category not found';
        end if;

        if v_category_flow is distinct from (case when v_is_income then 'income' else 'expense' end)::public.category_flow then
          raise exception 'category flow does not match the balance difference';
        end if;

        v_tx_note := coalesce(
          nullif(trim(p_note), ''),
          case when v_is_income then 'إيراد معروف — تحديث رصيد' else 'مصروف معروف — تحديث رصيد' end
        );
      else
        if v_is_income then
          v_category_id := public.get_or_create_reconciliation_category(v_user_id, 'إيراد غير معروف', '📥');
          v_tx_note := coalesce(nullif(trim(p_note), ''), 'إيراد غير معروف — تحديث رصيد');
        else
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
        v_wallet_id,
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
      v_wallet_id,
      v_recorded,
      v_actual,
      v_difference,
      v_resolution,
      v_adjustment_id,
      p_note
    )
    returning id into v_last_id;
  end loop;

  return coalesce(v_adjustment_id, v_last_id);
end;
$$;

grant execute on function public.reconcile_wallets_batch(jsonb, text) to authenticated;
