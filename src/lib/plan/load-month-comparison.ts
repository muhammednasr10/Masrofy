import { buildPlanComparison } from "@/lib/plan";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, MonthlyPlan, PlanComparison, PlanItem, Transaction } from "@/lib/types/database";

export async function loadMonthPlanComparison(
  supabase: SupabaseClient,
  planMonth: string,
  categories: Category[],
  monthTransactions: Transaction[],
): Promise<PlanComparison> {
  const { data: planRow } = await supabase
    .from("monthly_plans")
    .select("*")
    .eq("plan_month", planMonth)
    .maybeSingle();

  const plan = (planRow as MonthlyPlan | null) ?? null;
  let planItems: PlanItem[] = [];

  if (plan) {
    const { data: planItemRows } = await supabase
      .from("plan_items")
      .select("*")
      .eq("plan_id", plan.id);

    planItems = (planItemRows ?? []) as PlanItem[];
  }

  return buildPlanComparison({
    categories,
    plan,
    planItems,
    transactions: monthTransactions,
  });
}
