import type { SupabaseClient } from "@supabase/supabase-js";
import type { InternalWalletTransfer } from "@/lib/types/database";
import { readSupabaseError } from "@/lib/supabase/errors";
import type { WalletTransferFormState } from "@/lib/wallets/transfer";

export function validateWalletTransferForm(form: WalletTransferFormState) {
  if (!form.fromWalletId || !form.toWalletId) {
    return "اختر المحفظة المصدر والوجهة.";
  }

  if (form.fromWalletId === form.toWalletId) {
    return "اختر محفظتين مختلفتين.";
  }

  const amount = Number(form.amount);

  if (Number.isNaN(amount) || amount <= 0) {
    return "أدخل مبلغاً صحيحاً.";
  }

  if (!form.transactionDate) {
    return "اختر تاريخ التحويل.";
  }

  return null;
}

export function getWalletTransferErrorMessage(error: unknown) {
  const { message, code, details, hint } = readSupabaseError(error);
  const text = `${code} ${message} ${details} ${hint}`.toLowerCase();

  if (
    code === "PGRST202" ||
    code === "42883" ||
    (text.includes("transfer_between_own_wallets") &&
      (text.includes("schema cache") ||
        text.includes("does not exist") ||
        text.includes("could not find")))
  ) {
    return "دالة التحويل غير موجودة على قاعدة البيانات. طبّق ملف الهجرة 034_ensure_wallet_transfers.sql.";
  }

  if (code === "42501" || text.includes("permission denied")) {
    return "لا توجد صلاحية لتنفيذ التحويل. طبّق ملف الهجرة 034_ensure_wallet_transfers.sql ثم أعد المحاولة.";
  }

  if (text.includes("not authenticated")) {
    return "انتهت الجلسة. سجّل الدخول ثم أعد المحاولة.";
  }

  if (text.includes("source wallet not found") || text.includes("destination wallet not found")) {
    return "المحفظة غير موجودة أو لا تتبع حسابك.";
  }

  if (text.includes("cannot transfer to the same wallet")) {
    return "اختر محفظتين مختلفتين.";
  }

  if (text.includes("investment")) {
    return "لا يمكن التحويل من أو إلى محفظة استثمار.";
  }

  if (text.includes("amount must")) {
    return "أدخل مبلغاً صحيحاً.";
  }

  if (
    code === "22P02" ||
    text.includes("invalid input syntax for type uuid") ||
    text.includes("invalid input syntax for type date")
  ) {
    return "بيانات التحويل غير مكتملة. تأكد من اختيار المحفظتين والتاريخ.";
  }

  return message || "تعذر تنفيذ التحويل.";
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

  if (transferError || !transferId) {
    throw new Error(getWalletTransferErrorMessage(transferError ?? "تعذر تنفيذ التحويل."));
  }

  const { data: transferRow } = await supabase
    .from("internal_wallet_transfers")
    .select("*")
    .eq("id", transferId)
    .maybeSingle();

  return {
    transfer: (transferRow ?? null) as InternalWalletTransfer | null,
  };
}
