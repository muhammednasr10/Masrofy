import { buildDashboardAlerts } from "@/lib/alerts/dashboard";
import { buildPlanComparison } from "@/lib/plan";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Category,
  Investment,
  MonthlyPlan,
  PlanItem,
  Transaction,
  Wallet,
  WalletReconciliation,
} from "@/lib/types/database";
import { getMonthRange } from "@/lib/utils/format";
import type { DashboardAlert } from "@/lib/alerts/dashboard";

export async function loadHeaderAlerts(
  supabase: SupabaseClient,
  userId: string | undefined,
): Promise<DashboardAlert[]> {
  if (!userId) {
    return [];
  }

  const month = getMonthRange();
  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: profile },
    { data: transactions },
    { data: wallets },
    { data: investments },
    { data: categoryRows },
    { data: planRow },
    { data: dueRecurringRows },
    { data: reconciliationRows },
  ] = await Promise.all([
    supabase.from("profiles").select("currency").maybeSingle(),
    supabase
      .from("transactions")
      .select("*, categories(name, icon, color), wallets(name, icon, color)")
      .gte("transaction_date", month.start)
      .lte("transaction_date", month.end),
    supabase.from("wallets").select("*").order("sort_order", { ascending: true }),
    supabase.from("investments").select("*"),
    supabase.from("categories").select("*").order("sort_order", { ascending: true }),
    supabase.from("monthly_plans").select("*").eq("plan_month", month.start).maybeSingle(),
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

  const currency = profile?.currency ?? "EGP";
  const monthTransactions = ((transactions ?? []) as Transaction[]).filter(
    (transaction) => transaction.type !== "transfer",
  );
  const categories = (categoryRows ?? []) as Category[];

  let planItems: PlanItem[] = [];
  const typedPlan = (planRow as MonthlyPlan | null) ?? null;

  if (typedPlan) {
    const { data: planItemRows } = await supabase
      .from("plan_items")
      .select("*")
      .eq("plan_id", typedPlan.id);

    planItems = (planItemRows ?? []) as PlanItem[];
  }

  const planComparison = buildPlanComparison({
    categories,
    plan: typedPlan,
    planItems,
    transactions: monthTransactions,
  });

  return buildDashboardAlerts({
    planComparison,
    investments: (investments ?? []) as Investment[],
    wallets: (wallets ?? []) as Wallet[],
    reconciliations: (reconciliationRows ?? []) as WalletReconciliation[],
    currency,
    dueRecurringCount: dueRecurringRows?.length ?? 0,
  });
}
