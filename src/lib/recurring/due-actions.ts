import {
  advanceRecurringDueDate,
  isRecurringExpired,
} from "@/lib/recurring/schedule";
import type { RecurringTransaction, Transaction } from "@/lib/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export type RecurringDueActionResult =
  | { ok: true; transaction?: Transaction; updatedRecurring: RecurringTransaction }
  | { ok: false; error: string };

export async function registerRecurringDueTransaction(
  supabase: SupabaseClient,
  userId: string,
  recurring: RecurringTransaction,
): Promise<RecurringDueActionResult> {
  const { data: existing } = await supabase
    .from("transactions")
    .select("id")
    .eq("recurring_transaction_id", recurring.id)
    .eq("transaction_date", recurring.next_due_date)
    .maybeSingle();

  if (existing) {
    return { ok: false, error: "already_registered" };
  }

  const nextDueDate = advanceRecurringDueDate(recurring);
  const shouldDeactivate = isRecurringExpired({ ...recurring, next_due_date: nextDueDate });

  const { data: transaction, error: insertError } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      wallet_id: recurring.wallet_id,
      category_id: recurring.category_id,
      recurring_transaction_id: recurring.id,
      amount: recurring.amount,
      type: recurring.type,
      note: recurring.note,
      transaction_date: recurring.next_due_date,
    })
    .select("*, categories(name, icon, color), wallets(name, icon, color)")
    .single();

  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  const { data: updatedRecurring, error: updateError } = await supabase
    .from("recurring_transactions")
    .update({
      next_due_date: nextDueDate,
      is_active: shouldDeactivate ? false : recurring.is_active,
    })
    .eq("id", recurring.id)
    .select("*, categories(name, icon, color), wallets(name, icon, color)")
    .single();

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  return {
    ok: true,
    transaction: transaction as Transaction,
    updatedRecurring: updatedRecurring as RecurringTransaction,
  };
}

export async function skipRecurringDueTransaction(
  supabase: SupabaseClient,
  recurring: RecurringTransaction,
): Promise<RecurringDueActionResult> {
  const nextDueDate = advanceRecurringDueDate(recurring);
  const shouldDeactivate = isRecurringExpired({ ...recurring, next_due_date: nextDueDate });

  const { data: updatedRecurring, error: updateError } = await supabase
    .from("recurring_transactions")
    .update({
      next_due_date: nextDueDate,
      is_active: shouldDeactivate ? false : recurring.is_active,
    })
    .eq("id", recurring.id)
    .select("*, categories(name, icon, color), wallets(name, icon, color)")
    .single();

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  return { ok: true, updatedRecurring: updatedRecurring as RecurringTransaction };
}
