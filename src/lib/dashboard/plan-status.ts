import type { PlanComparison } from "@/lib/types/database";
import type { Translator } from "@/i18n/translate";

export function getDashboardPlanStatus(
  planComparison: PlanComparison,
  formatAmount: (value: number) => string,
  t: Translator,
) {
  if (!planComparison.hasPlan) {
    return t("dashboard.planNoPlan");
  }

  const planDiff = planComparison.expenses.difference;

  if (planDiff === 0) {
    return t("dashboard.planMatched");
  }

  if (planDiff > 0) {
    return t("dashboard.planOver", { amount: formatAmount(planDiff) });
  }

  return t("dashboard.planUnder", { amount: formatAmount(Math.abs(planDiff)) });
}
