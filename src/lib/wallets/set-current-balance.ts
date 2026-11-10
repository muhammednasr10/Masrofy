import type { SupabaseClient } from "@supabase/supabase-js";
import type { Transaction, Wallet } from "@/lib/types/database";
import { roundMoney } from "@/lib/utils/money";
import {
  calculateWalletBalance,
  isCreditWallet,
  openingBalanceFromCurrentBalance,
} from "@/lib/wallets/balance";
import { getBalanceDifferenceKind } from "@/lib/wallets/reconciliation-labels";

export type InventoryDifferenceClassification = "unknown" | "known";

/** Auto-generated balance fix rows — these piled up and created the fake +60k. */
const ADJUSTMENT_NOTE_PATTERN =
  /تحديث رصيد|تحديث أرصدة المحافظ|تعديل رصيد من صفحة المحافظ/;

export function isBalanceAdjustmentTransaction(transaction: Pick<Transaction, "note">) {
  const note = transaction.note?.trim() ?? "";
  return note.length > 0 && ADJUSTMENT_NOTE_PATTERN.test(note);
}

async function fetchWalletLedger(
  supabase: SupabaseClient,
  walletId: string,
): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, wallet_id, amount, type, transfer_role, transaction_date, note")
    .eq("wallet_id", walletId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Transaction[];
}

export async function deleteBalanceAdjustmentTransactions(
  supabase: SupabaseClient,
  walletId?: string,
) {
  let query = supabase
    .from("transactions")
    .select("id, note")
    .or(
      "note.ilike.%تحديث رصيد%,note.ilike.%تحديث أرصدة المحافظ%,note.ilike.%تعديل رصيد من صفحة المحافظ%",
    );

  if (walletId) {
    query = query.eq("wallet_id", walletId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const ids = ((data ?? []) as Pick<Transaction, "id" | "note">[])
    .filter((transaction) => isBalanceAdjustmentTransaction(transaction))
    .map((transaction) => transaction.id);

  if (ids.length === 0) {
    return 0;
  }

  const { error: deleteError } = await supabase.from("transactions").delete().in("id", ids);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  return ids.length;
}

/**
 * Make the wallet show exactly `desiredBalance`:
 * 1) remove auto balance-adjustment transactions (the fake 60k etc.)
 * 2) set opening so opening + remaining net = desiredBalance
 */
export async function setWalletCurrentBalance(
  supabase: SupabaseClient,
  wallet: Pick<Wallet, "id" | "card_kind" | "opening_balance">,
  desiredBalance: number,
) {
  const nextBalance = roundMoney(desiredBalance);
  await deleteBalanceAdjustmentTransactions(supabase, wallet.id);

  const ledger = await fetchWalletLedger(supabase, wallet.id);
  const openingBalance = openingBalanceFromCurrentBalance(nextBalance, wallet, ledger);

  const { error } = await supabase
    .from("wallets")
    .update({ opening_balance: openingBalance })
    .eq("id", wallet.id);

  if (error) {
    throw new Error(error.message);
  }

  const verified = calculateWalletBalance(
    { ...wallet, opening_balance: openingBalance } as Wallet,
    ledger,
  );

  if (Math.abs(verified - nextBalance) >= 0.02) {
    throw new Error(
      `تعذر تثبيت الرصيد على ${nextBalance}. المحسوب بعد الحفظ: ${verified}.`,
    );
  }

  return {
    openingBalance,
    verifiedBalance: verified,
  };
}

/**
 * Inventory update: unknown → adjust opening only.
 * known → record a real categorized income/expense for the gap, then lock the balance.
 * Never inserts the old ghost “تحديث رصيد” rows.
 */
export async function applyWalletInventoryBalance(
  supabase: SupabaseClient,
  wallet: Pick<Wallet, "id" | "card_kind" | "opening_balance">,
  desiredBalance: number,
  options: {
    userId: string;
    classification: InventoryDifferenceClassification;
    categoryId?: string | null;
    note?: string | null;
  },
) {
  const nextBalance = roundMoney(desiredBalance);
  await deleteBalanceAdjustmentTransactions(supabase, wallet.id);

  let ledger = await fetchWalletLedger(supabase, wallet.id);
  const recorded = calculateWalletBalance({ ...wallet } as Wallet, ledger);
  const difference = roundMoney(nextBalance - recorded);

  if (Math.abs(difference) < 0.005) {
    return setWalletCurrentBalance(supabase, wallet, nextBalance);
  }

  if (options.classification === "known") {
    if (!options.categoryId) {
      throw new Error("اختَر فئة للفرق المعروف.");
    }

    const kind = getBalanceDifferenceKind(difference, isCreditWallet(wallet));
    if (!kind) {
      throw new Error("لا يوجد فرق لتسجيله.");
    }

    const note = options.note?.trim() || null;
    if (note && isBalanceAdjustmentTransaction({ note })) {
      throw new Error("استخدم ملاحظة عادية، مش ملاحظة تحديث رصيد تلقائي.");
    }

    const { error: insertError } = await supabase.from("transactions").insert({
      user_id: options.userId,
      wallet_id: wallet.id,
      category_id: options.categoryId,
      amount: Math.abs(difference),
      type: kind,
      note,
      transaction_date: new Date().toISOString().slice(0, 10),
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    ledger = await fetchWalletLedger(supabase, wallet.id);
  }

  const openingBalance = openingBalanceFromCurrentBalance(nextBalance, wallet, ledger);
  const { error } = await supabase
    .from("wallets")
    .update({ opening_balance: openingBalance })
    .eq("id", wallet.id);

  if (error) {
    throw new Error(error.message);
  }

  const verified = calculateWalletBalance(
    { ...wallet, opening_balance: openingBalance } as Wallet,
    ledger,
  );

  if (Math.abs(verified - nextBalance) >= 0.02) {
    throw new Error(
      `تعذر تثبيت الرصيد على ${nextBalance}. المحسوب بعد الحفظ: ${verified}.`,
    );
  }

  return {
    openingBalance,
    verifiedBalance: verified,
  };
}
