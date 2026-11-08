-- Stop inventing fake income/expense rows when updating wallet balances.
-- Opening balance is adjusted instead; existing ghost adjustment txs are removed.

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
  v_opening numeric(12, 2);
  v_last_id uuid;
  v_resolution public.reconciliation_resolution;
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
    v_actual := round((v_item->>'actual_balance')::numeric, 2);

    select * into v_wallet
    from public.wallets
    where id = v_wallet_id
      and user_id = v_user_id;

    if v_wallet.id is null then
      raise exception 'wallet not found';
    end if;

    -- Remove stacked auto balance-fix transactions (the fake +60k etc.).
    delete from public.transactions
    where wallet_id = v_wallet_id
      and user_id = v_user_id
      and note is not null
      and (
        note ~ 'تحديث رصيد'
        or note ~ 'تحديث أرصدة المحافظ'
        or note ~ 'تعديل رصيد من صفحة المحافظ'
      );

    v_tx_net := public.wallet_transaction_net(v_wallet_id);

    if v_wallet.card_kind = 'credit' then
      v_recorded := v_wallet.opening_balance - v_tx_net;
      v_opening := round(v_actual + v_tx_net, 2);
    else
      v_recorded := v_wallet.opening_balance + v_tx_net;
      v_opening := round(v_actual - v_tx_net, 2);
    end if;

    v_difference := round(v_actual - v_recorded, 2);

    if abs(v_difference) < 0.005 then
      v_resolution := 'matched';
    else
      v_resolution := 'adjust_opening';

      update public.wallets
      set opening_balance = v_opening
      where id = v_wallet_id
        and user_id = v_user_id;
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
      null,
      p_note
    )
    returning id into v_last_id;
  end loop;

  return v_last_id;
end;
$$;

grant execute on function public.reconcile_wallets_batch(jsonb, text) to authenticated;

-- Remove stacked ghost adjustment rows. Do NOT rewrite opening_balance to keep the
-- inflated total — deleting a fake +60k income should drop the shown balance by 60k.
delete from public.transactions
where note is not null
  and (
    note ~ 'تحديث رصيد'
    or note ~ 'تحديث أرصدة المحافظ'
    or note ~ 'تعديل رصيد من صفحة المحافظ'
  );
