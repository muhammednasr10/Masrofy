import { buildDashboardAlerts } from "@/lib/alerts";
import { buildPlanComparison } from "@/lib/plan";
import { summarizeInvestments } from "@/lib/investments/utils";
import { summarizeSavingsGoals } from "@/lib/savings/utils";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Category,
  Investment,
  MonthlyPlan,
  PlanComparison,
  PlanItem,
  Profile,
  SavingsGoal,
  Transaction,
  Wallet,
  WalletReconciliation,
} from "@/lib/types/database";
import { formatCurrency, getMonthRange } from "@/lib/utils/format";
import { summarizeTransactions } from "@/lib/utils/summary";
import { summarizePortfolioWealth } from "@/lib/wallets";
import type { DashboardAlert } from "@/lib/alerts/dashboard";

export type DashboardData = {
  profile: Pick<Profile, "full_name" | "currency"> | null;
  currency: string;
  monthLabel: string;
  summary: ReturnType<typeof summarizeTransactions>;
  portfolio: ReturnType<typeof summarizePortfolioWealth>;
  investmentSummary: ReturnType<typeof summarizeInvestments>;
  savingsSummary: ReturnType<typeof summarizeSavingsGoals>;
  planComparison: PlanComparison;
  planStatus: string;
  alerts: DashboardAlert[];
  acceptedFriends: number;
  dueRecurringCount: number;
  categoryCount: number;
  walletCount: number;
  investmentCount: number;
  transactionCount: number;
  topCategory: ReturnType<typeof summarizeTransactions>["byCategory"][number] | undefined;
};

export async function loadDashboardData(
  supabase: SupabaseClient,
  userId: string | undefined,
): Promise<DashboardData> {
  const month = getMonthRange();
  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: profile },
    { data: transactions },
    { data: wallets },
    { data: allTransactions },
    { data: investments },
    { data: categoryRows },
    { data: planRow },
    { data: friendships },
    { data: dueRecurringRows },
    { data: reconciliationRows },
    { data: savingsGoalRows },
  ] = await Promise.all([
    supabase.from("profiles").select("currency, full_name").maybeSingle(),
    supabase
      .from("transactions")
      .select("*, categories(name, icon, color), wallets(name, icon, color)")
      .gte("transaction_date", month.start)
      .lte("transaction_date", month.end),
    supabase.from("wallets").select("*").order("sort_order", { ascending: true }),
    supabase.from("transactions").select("id, wallet_id, amount, type, transfer_role"),
    supabase.from("investments").select("*"),
    supabase.from("categories").select("*").order("sort_order", { ascending: true }),
    supabase.from("monthly_plans").select("*").eq("plan_month", month.start).maybeSingle(),
    userId
      ? supabase
          .from("friendships")
          .select("id")
          .eq("status", "accepted")
          .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      : Promise.resolve({ data: [] }),
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
    supabase
      .from("savings_goals")
      .select("*")
      .eq("is_completed", false)
      .order("sort_order", { ascending: true }),
  ]);

  const currency = profile?.currency ?? "EGP";
  const monthTransactions = ((transactions ?? []) as Transaction[]).filter(
    (transaction) => transaction.type !== "transfer",
  );
  const categories = (categoryRows ?? []) as Category[];
  const summary = summarizeTransactions(monthTransactions);
  const portfolio = summarizePortfolioWealth(
    (wallets ?? []) as Wallet[],
    (allTransactions ?? []) as Transaction[],
    (investments ?? []) as Investment[],
  );
  const investmentSummary = summarizeInvestments((investments ?? []) as Investment[]);
  const savingsSummary = summarizeSavingsGoals((savingsGoalRows ?? []) as SavingsGoal[]);

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

  const planDiff = planComparison.expenses.difference;
  const planStatus =
    !planComparison.hasPlan
      ? "لم تُحفظ خطة لهذا الشهر"
      : planDiff === 0
        ? "المصروفات مطابقة للخطة"
        : planDiff > 0
          ? `تجاوزت الخطة بـ ${formatCurrency(planDiff, currency)}`
          : `أقل من الخطة بـ ${formatCurrency(Math.abs(planDiff), currency)}`;

  const alerts = buildDashboardAlerts({
    planComparison,
    investments: (investments ?? []) as Investment[],
    wallets: (wallets ?? []) as Wallet[],
    reconciliations: (reconciliationRows ?? []) as WalletReconciliation[],
    currency,
    dueRecurringCount: dueRecurringRows?.length ?? 0,
  });

  return {
    profile: profile as Pick<Profile, "full_name" | "currency"> | null,
    currency,
    monthLabel: month.label,
    summary,
    portfolio,
    investmentSummary,
    savingsSummary,
    planComparison,
    planStatus,
    alerts,
    acceptedFriends: friendships?.length ?? 0,
    dueRecurringCount: dueRecurringRows?.length ?? 0,
    categoryCount: categories.length,
    walletCount: wallets?.length ?? 0,
    investmentCount: investments?.length ?? 0,
    transactionCount: monthTransactions.length,
    topCategory: summary.byCategory[0],
  };
}
