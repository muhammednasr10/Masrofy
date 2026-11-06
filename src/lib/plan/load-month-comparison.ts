import type { Locale } from "@/i18n/config";
import { horizonLinesFromItems } from "@/lib/plan/horizon-lines";
import { buildHorizonMonthPlan, horizonMonthPlanRecords } from "@/lib/plan/month-from-horizon";
import { buildPlanComparison } from "@/lib/plan/summary";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Category,
  HorizonPlanItem,
  MonthlyPlan,
  PlanComparison,
  PlanItem,
  Transaction,
} from "@/lib/types/database";
import { getMonthRange } from "@/lib/calendar";

export async function loadMonthPlanComparison(
  supabase: SupabaseClient,
  planMonth: string,
  categories: Category[],
  monthTransactions: Transaction[],
  monthStartDay = 1,
  referenceDate = new Date(),
  locale: Locale = "ar",
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

  const month = getMonthRange(referenceDate, locale, monthStartDay);
  const { data: horizonPlan } = await supabase.from("horizon_plans").select("id").maybeSingle();
  let horizonItems: HorizonPlanItem[] = [];

  if (horizonPlan?.id) {
    const { data: horizonRows } = await supabase
      .from("horizon_plan_items")
      .select("*")
      .eq("plan_id", horizonPlan.id);

    horizonItems = (horizonRows ?? []) as HorizonPlanItem[];
  }

  const horizonMonth = buildHorizonMonthPlan(
    categories,
    horizonLinesFromItems(categories, horizonItems, month.start),
    month.start,
    month.end,
  );

  const horizonRecords = horizonMonth.usesHorizon
    ? horizonMonth.hasAmount
      ? horizonMonthPlanRecords(horizonMonth.plannedIncome, horizonMonth.plannedByCategory, month.start)
      : { plan: null, planItems: [] as PlanItem[] }
    : null;

  return buildPlanComparison({
    categories,
    plan: horizonRecords ? horizonRecords.plan : plan,
    planItems: horizonRecords ? horizonRecords.planItems : planItems,
    transactions: monthTransactions,
    monthStartDay,
    referenceDate,
    locale,
  });
}
