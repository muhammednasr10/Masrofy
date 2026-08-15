import { loadMonthPlanComparison } from "@/lib/plan/load-month-comparison";
import { summarizeInvestments } from "@/lib/investments/utils";
import { summarizeSavingsGoals } from "@/lib/savings/utils";
import type { Locale } from "@/i18n/config";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Category,
  Investment,
  PlanComparison,
  Profile,
  SavingsGoal,
  Transaction,
  Wallet,
} from "@/lib/types/database";
import { getMonthRange, normalizeMonthStartDay } from "@/lib/calendar";
import { summarizeTransactions } from "@/lib/utils/summary";
import { summarizePortfolioWealth } from "@/lib/wallets";

export type DashboardData = {
  profile: Pick<Profile, "full_name" | "currency"> | null;
  currency: string;
  monthLabel: string;
  summary: ReturnType<typeof summarizeTransactions>;
  portfolio: ReturnType<typeof summarizePortfolioWealth>;
  investmentSummary: ReturnType<typeof summarizeInvestments>;
  savingsSummary: ReturnType<typeof summarizeSavingsGoals>;
  planComparison: PlanComparison;
  acceptedFriends: number;
  dueRecurringCount: number;
  categoryCount: number;
  walletCount: number;
  investmentCount: number;
  transactionCount: number;
  topCategory: ReturnType<typeof summarizeTransactions>["byCategory"][number] | undefined;
};

function filterMonthTransactions(transactions: Transaction[] | null | undefined) {
  return ((transactions ?? []) as Transaction[]).filter(
    (transaction) => transaction.type !== "transfer",
  );
}

export async function loadDashboardData(
  supabase: SupabaseClient,
  userId: string | undefined,
  locale: Locale = "ar",
): Promise<DashboardData> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("currency, full_name, month_start_day")
    .maybeSingle();
  const month = getMonthRange(new Date(), locale, profile?.month_start_day);
  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: transactions },
    { data: wallets },
    { data: allTransactions },
    { data: investments },
    { data: categoryRows },
    { data: friendships },
    { data: dueRecurringRows },
    { data: savingsGoalRows },
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, categories(name, icon, color), wallets(name, icon, color)")
      .gte("transaction_date", month.start)
      .lte("transaction_date", month.end),
    supabase.from("wallets").select("*").order("sort_order", { ascending: true }),
    supabase.from("transactions").select("id, wallet_id, amount, type, transfer_role"),
    supabase.from("investments").select("*"),
    supabase.from("categories").select("*").order("sort_order", { ascending: true }),
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
      .from("savings_goals")
      .select("*")
      .eq("is_completed", false)
      .order("sort_order", { ascending: true }),
  ]);

  const currency = profile?.currency ?? "EGP";
  const monthTransactions = filterMonthTransactions(transactions);
  const categories = (categoryRows ?? []) as Category[];
  const summary = summarizeTransactions(monthTransactions);
  const portfolio = summarizePortfolioWealth(
    (wallets ?? []) as Wallet[],
    (allTransactions ?? []) as Transaction[],
    (investments ?? []) as Investment[],
  );
  const investmentSummary = summarizeInvestments((investments ?? []) as Investment[]);
  const savingsSummary = summarizeSavingsGoals((savingsGoalRows ?? []) as SavingsGoal[]);
  const planComparison = await loadMonthPlanComparison(
    supabase,
    month.start,
    categories,
    monthTransactions,
    normalizeMonthStartDay(profile?.month_start_day),
  );

  return {
    profile: profile as Pick<Profile, "full_name" | "currency"> | null,
    currency,
    monthLabel: month.label,
    summary,
    portfolio,
    investmentSummary,
    savingsSummary,
    planComparison,
    acceptedFriends: friendships?.length ?? 0,
    dueRecurringCount: dueRecurringRows?.length ?? 0,
    categoryCount: categories.length,
    walletCount: wallets?.length ?? 0,
    investmentCount: investments?.length ?? 0,
    transactionCount: monthTransactions.length,
    topCategory: summary.byCategory[0],
  };
}
