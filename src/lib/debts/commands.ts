import type { SupabaseClient } from "@supabase/supabase-js";
import { debtRemaining, type DebtDirection } from "@/lib/debts/balance";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import type { Debt } from "@/lib/types/database";

export type DebtInput = {
  name: string;
  direction: DebtDirection;
  principal: number;
  categoryId: string | null;
  walletId: string | null;
  openedOn: string;
  notes: string;
};

async function paidTotal(supabase: SupabaseClient, debtId: string) {
  const { data, error } = await supabase.from("debt_payments").select("amount").eq("debt_id", debtId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce((total, row) => total + Number(row.amount), 0);
}

async function defaultWalletId(supabase: SupabaseClient) {
  const [{ data: wallets, error }, { data: profile }] = await Promise.all([
    supabase.from("wallets").select("id, is_default"),
    supabase.from("profiles").select("default_wallet_id").maybeSingle(),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  return profile?.default_wallet_id ?? wallets?.find((wallet) => wallet.is_default)?.id ?? wallets?.[0]?.id ?? null;
}

export async function saveDebt(supabase: SupabaseClient, input: DebtInput, debtId?: string) {
  const user = await requireAuthenticatedUser(supabase);
  const name = input.name.trim();

  if (!name) {
    throw new Error("اكتب اسم الجهة أو الشخص.");
  }

  if (!(input.principal > 0)) {
    throw new Error("أصل الدين لازم يكون أكبر من صفر.");
  }

  if (debtId) {
    const paid = await paidTotal(supabase, debtId);

    if (input.principal < paid) {
      throw new Error("أصل الدين أقل من المبلغ المدفوع.");
    }
  }

  const payload = {
    user_id: user.id,
    name,
    direction: input.direction,
    principal: input.principal,
    category_id: input.categoryId || null,
    wallet_id: input.walletId || null,
    opened_on: input.openedOn,
    notes: input.notes.trim() || null,
  };

  const query = debtId
    ? supabase.from("debts").update(payload).eq("id", debtId)
    : supabase.from("debts").insert(payload);
  const { error } = await query;

  if (error) {
    if (error.message.includes("debts_user_category_unique")) {
      throw new Error("الفئة دي مربوطة بدين تاني.");
    }

    if (error.code === "42P01" || error.message.includes("public.debts")) {
      throw new Error("جدول الديون لسه مش موجود. نفّذ ملف 038_debts.sql في محرر SQL.");
    }

    throw new Error(error.message);
  }
}

export async function deleteDebt(supabase: SupabaseClient, debtId: string) {
  await requireAuthenticatedUser(supabase);
  const { error } = await supabase.from("debts").delete().eq("id", debtId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function recordDebtPayment(
  supabase: SupabaseClient,
  debt: Pick<Debt, "id" | "name" | "direction" | "principal" | "category_id" | "wallet_id">,
  input: { amount: number; paidOn: string },
) {
  const user = await requireAuthenticatedUser(supabase);
  const paid = await paidTotal(supabase, debt.id);
  const remaining = debtRemaining(Number(debt.principal), paid);

  if (!(input.amount > 0)) {
    throw new Error("اكتب مبلغ الدفعة.");
  }

  if (input.amount > remaining) {
    throw new Error("الدفعة أكبر من الباقي.");
  }

  const walletId = debt.wallet_id ?? (await defaultWalletId(supabase));

  if (!walletId) {
    throw new Error("مفيش محفظة نسجل عليها الدفعة.");
  }

  const type = debt.direction === "i_owe" ? "expense" : "income";
  const note = debt.direction === "i_owe" ? `سداد دين: ${debt.name}` : `تحصيل دين: ${debt.name}`;
  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      wallet_id: walletId,
      category_id: debt.category_id,
      amount: input.amount,
      type,
      note,
      transaction_date: input.paidOn,
    })
    .select("id")
    .single();

  if (transactionError || !transaction) {
    throw new Error(transactionError?.message ?? "تعذر تسجيل الدفعة.");
  }

  const { error } = await supabase.from("debt_payments").insert({
    user_id: user.id,
    debt_id: debt.id,
    transaction_id: transaction.id,
    amount: input.amount,
    paid_on: input.paidOn,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function applyPlanDueToDebt(
  supabase: SupabaseClient,
  input: { categoryId: string; amount: number; paidOn: string; transactionId: string; flow: "income" | "expense" },
) {
  const user = await requireAuthenticatedUser(supabase);
  const { data: debt, error } = await supabase
    .from("debts")
    .select("id, direction, principal")
    .eq("category_id", input.categoryId)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01" || error.message.includes("public.debts")) {
      return;
    }

    throw new Error(error.message);
  }

  if (!debt) {
    return;
  }

  const matches =
    (debt.direction === "i_owe" && input.flow === "expense") ||
    (debt.direction === "owed_to_me" && input.flow === "income");

  if (!matches) {
    return;
  }

  const { data: linked, error: linkedError } = await supabase
    .from("debt_payments")
    .select("id")
    .eq("transaction_id", input.transactionId)
    .limit(1);

  if (linkedError) {
    throw new Error(linkedError.message);
  }

  if ((linked ?? []).length > 0) {
    return;
  }

  const paid = await paidTotal(supabase, debt.id);
  const amount = Math.min(input.amount, debtRemaining(Number(debt.principal), paid));

  if (!(amount > 0)) {
    return;
  }

  const { error: insertError } = await supabase.from("debt_payments").insert({
    user_id: user.id,
    debt_id: debt.id,
    transaction_id: input.transactionId,
    amount,
    paid_on: input.paidOn,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }
}
