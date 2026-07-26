import type { SupabaseClient } from "@supabase/supabase-js";
import type { InternalWalletTransfer, Transaction } from "@/lib/types/database";
import type { WalletTransferFormState } from "@/lib/wallets/transfer";

export function validateWalletTransferForm(form: WalletTransferFormState) {
  if (form.fromWalletId === form.toWalletId) {
    return "اختر محفظتين مختلفتين.";
  }

  const amount = Number(form.amount);

  if (Number.isNaN(amount) || amount <= 0) {
    return "أدخل مبلغاً صحيحاً.";
  }

  return null;
}

export async function executeWalletTransfer(
  supabase: SupabaseClient,
  form: WalletTransferFormState,
) {
  const validationError = validateWalletTransferForm(form);

  if (validationError) {
    throw new Error(validationError);
  }

  const { data: transferId, error: transferError } = await supabase.rpc(
    "transfer_between_own_wallets",
    {
      p_from_wallet_id: form.fromWalletId,
      p_to_wallet_id: form.toWalletId,
      p_amount: Number(form.amount),
      p_note: form.note.trim() || null,
      p_transaction_date: form.transactionDate,
    },
  );

  if (transferError) {
    throw transferError;
  }

  const [{ data: transferRow }, { data: balanceRows }] = await Promise.all([
    supabase.from("internal_wallet_transfers").select("*").eq("id", transferId).single(),
    supabase.from("transactions").select("id, wallet_id, amount, type, transfer_role"),
  ]);

  return {
    transfer: (transferRow ?? null) as InternalWalletTransfer | null,
    balanceTransactions: (balanceRows ?? []) as Transaction[],
  };
}
