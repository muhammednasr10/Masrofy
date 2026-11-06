import type { SupabaseClient } from "@supabase/supabase-js";
import { enqueueTransactionInsert } from "@/lib/offline/sync-queue";
import { isBrowserOnline } from "@/lib/offline/sync-engine";
import { applyPlanDueToDebt } from "@/lib/debts/commands";
import type { DuePlanLine } from "@/lib/plan/expected-day";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";

export async function recordPlanDueTransaction(supabase: SupabaseClient, line: DuePlanLine) {
  const user = await requireAuthenticatedUser(supabase);
  const [{ data: wallets, error: walletError }, { data: profile }] = await Promise.all([
    supabase.from("wallets").select("id, is_default"),
    supabase.from("profiles").select("default_wallet_id").maybeSingle(),
  ]);

  if (walletError) {
    throw new Error(walletError.message);
  }

  const walletId =
    line.walletId ??
    profile?.default_wallet_id ??
    wallets?.find((wallet) => wallet.is_default)?.id ??
    wallets?.[0]?.id;

  if (!walletId) {
    throw new Error("مفيش محفظة نسجل عليها المبلغ.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("transactions")
    .select("id")
    .eq("category_id", line.categoryId)
    .eq("type", line.flow)
    .eq("transaction_date", line.dueDate)
    .limit(1);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const payload = {
    wallet_id: walletId,
    category_id: line.categoryId,
    amount: line.amount,
    type: line.flow,
    note: "من وضع الخطة",
    transaction_date: line.dueDate,
  };

  let transactionId = existing?.[0]?.id ?? null;

  if (!transactionId) {
    if (!isBrowserOnline()) {
      await enqueueTransactionInsert(user.id, crypto.randomUUID(), payload);
      return;
    }

    const { data: inserted, error } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        ...payload,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      throw new Error(error?.message ?? "تعذر تسجيل المبلغ.");
    }

    transactionId = inserted.id;
  }

  if (line.flow === "income" || line.flow === "expense") {
    await applyPlanDueToDebt(supabase, {
      categoryId: line.categoryId,
      amount: line.amount,
      paidOn: line.dueDate,
      transactionId,
      flow: line.flow,
    });
  }
}
