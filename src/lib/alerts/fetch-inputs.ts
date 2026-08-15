import { loadMonthPlanComparison } from "@/lib/plan/load-month-comparison";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Category,
  Investment,
  PlanComparison,
  RecurringTransaction,
  Transaction,
  Wallet,
  WalletReconciliation,
} from "@/lib/types/database";
import { getMonthRange, normalizeMonthStartDay } from "@/lib/calendar";

export type AlertInputs = {
  profile: { currency?: string | null; locale?: string | null } | null;
  planComparison: PlanComparison;
  investments: Investment[];
  wallets: Wallet[];
  reconciliations: WalletReconciliation[];
  dueRecurrings: RecurringTransaction[];
};

function filterMonthTransactions(transactions: Transaction[] | null | undefined) {
  return ((transactions ?? []) as Transaction[]).filter(
    (transaction) => transaction.type !== "transfer",
  );
}

export async function fetchAlertInputs(
  supabase: SupabaseClient,
): Promise<AlertInputs> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("currency, locale, month_start_day")
    .maybeSingle();
  const month = getMonthRange(new Date(), "ar", profile?.month_start_day);
  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: transactions },
    { data: wallets },
    { data: investments },
    { data: categoryRows },
    { data: dueRecurringRows },
    { data: reconciliationRows },
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, categories(name, icon, color), wallets(name, icon, color)")
      .gte("transaction_date", month.start)
      .lte("transaction_date", month.end),
    supabase.from("wallets").select("*").order("sort_order", { ascending: true }),
    supabase.from("investments").select("*"),
    supabase.from("categories").select("*").order("sort_order", { ascending: true }),
    supabase
      .from("recurring_transactions")
      .select("*, categories(name, icon, color), wallets(name, icon, color)")
      .eq("is_active", true)
      .lte("next_due_date", today)
      .order("next_due_date", { ascending: true }),
    supabase
      .from("wallet_reconciliations")
      .select("*, wallets(name, icon, color)")
      .order("reconciled_at", { ascending: false })
      .limit(50),
  ]);

  const categories = (categoryRows ?? []) as Category[];
  const monthTransactions = filterMonthTransactions(transactions);
  const planComparison = await loadMonthPlanComparison(
    supabase,
    month.start,
    categories,
    monthTransactions,
    normalizeMonthStartDay(profile?.month_start_day),
  );

  return {
    profile: profile ?? null,
    planComparison,
    investments: (investments ?? []) as Investment[],
    wallets: (wallets ?? []) as Wallet[],
    reconciliations: (reconciliationRows ?? []) as WalletReconciliation[],
    dueRecurrings: (dueRecurringRows ?? []) as RecurringTransaction[],
  };
}
