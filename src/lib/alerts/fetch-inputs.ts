import { loadMonthPlanComparison } from "@/lib/plan/load-month-comparison";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Category,
  Investment,
  PlanComparison,
  Transaction,
  Wallet,
  WalletReconciliation,
} from "@/lib/types/database";
import { getMonthRange } from "@/lib/utils/format";

export type AlertInputs = {
  profile: { currency?: string | null; locale?: string | null } | null;
  planComparison: PlanComparison;
  investments: Investment[];
  wallets: Wallet[];
  reconciliations: WalletReconciliation[];
  dueRecurringCount: number;
};

function filterMonthTransactions(transactions: Transaction[] | null | undefined) {
  return ((transactions ?? []) as Transaction[]).filter(
    (transaction) => transaction.type !== "transfer",
  );
}

export async function fetchAlertInputs(
  supabase: SupabaseClient,
): Promise<AlertInputs> {
  const month = getMonthRange();
  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: profile },
    { data: transactions },
    { data: wallets },
    { data: investments },
    { data: categoryRows },
    { data: dueRecurringRows },
    { data: reconciliationRows },
  ] = await Promise.all([
    supabase.from("profiles").select("currency, locale").maybeSingle(),
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
      .select("id")
      .eq("is_active", true)
      .lte("next_due_date", today),
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
  );

  return {
    profile: profile ?? null,
    planComparison,
    investments: (investments ?? []) as Investment[],
    wallets: (wallets ?? []) as Wallet[],
    reconciliations: (reconciliationRows ?? []) as WalletReconciliation[],
    dueRecurringCount: dueRecurringRows?.length ?? 0,
  };
}
