import { getDirectChildCategories } from "@/lib/categories/hierarchy";
import { isIncomeCategory } from "@/lib/categories/flow";
import {
  isConfirmedHorizonLine,
  isOpenEndedDate,
  lineSpanReady,
  occurrenceCount,
  type HorizonLineDraft,
} from "@/lib/plan/horizon";
import type { Category, MonthlyPlan, PlanItem } from "@/lib/types/database";

export function monthlyAmountInWindow(
  line: HorizonLineDraft | undefined,
  windowStart: string,
  windowEnd: string,
) {
  if (!line || line.cadence !== "monthly" || !isConfirmedHorizonLine(line)) {
    return 0;
  }

  if (!lineSpanReady(line.startDate, line.endDate)) {
    return 0;
  }

  const amount = Number(line.amount || 0);

  if (!(amount > 0) || windowEnd < windowStart) {
    return 0;
  }

  const planEnd = isOpenEndedDate(line.endDate) ? windowEnd : line.endDate;

  return amount * occurrenceCount("monthly", line.startDate, planEnd, windowStart, windowEnd);
}

function hasMonthlyDescendantInWindow(
  categoryId: string,
  categories: Category[],
  lines: Record<string, HorizonLineDraft>,
  windowStart: string,
  windowEnd: string,
): boolean {
  return getDirectChildCategories(categoryId, categories).some(
    (child) =>
      monthlyAmountInWindow(lines[child.id], windowStart, windowEnd) > 0 ||
      hasMonthlyDescendantInWindow(child.id, categories, lines, windowStart, windowEnd),
  );
}

export function horizonUsesMonthlyLines(lines: Record<string, HorizonLineDraft>) {
  return Object.values(lines).some((line) => {
    if (!line || line.cadence !== "monthly" || !isConfirmedHorizonLine(line)) {
      return false;
    }

    if (!lineSpanReady(line.startDate, line.endDate)) {
      return false;
    }

    return Number(line.amount || 0) > 0;
  });
}

export function buildHorizonMonthPlan(
  categories: Category[],
  lines: Record<string, HorizonLineDraft>,
  windowStart: string,
  windowEnd: string,
) {
  const plannedByCategory = new Map<string, number>();
  let plannedIncome = 0;

  for (const category of categories) {
    if (hasMonthlyDescendantInWindow(category.id, categories, lines, windowStart, windowEnd)) {
      continue;
    }

    const amount = monthlyAmountInWindow(lines[category.id], windowStart, windowEnd);

    if (!(amount > 0)) {
      continue;
    }

    if (isIncomeCategory(category)) {
      plannedIncome += amount;
      continue;
    }

    plannedByCategory.set(category.id, amount);
  }

  return {
    usesHorizon: horizonUsesMonthlyLines(lines),
    plannedIncome,
    plannedByCategory,
    hasAmount: plannedIncome > 0 || plannedByCategory.size > 0,
  };
}

export function horizonMonthPlanRecords(
  plannedIncome: number,
  plannedByCategory: Map<string, number>,
  planMonth: string,
): { plan: MonthlyPlan; planItems: PlanItem[] } {
  const plan: MonthlyPlan = {
    id: "horizon-month",
    user_id: "",
    plan_month: planMonth,
    planned_income: plannedIncome,
    notes: null,
    created_at: "",
    updated_at: "",
  };

  const planItems: PlanItem[] = [...plannedByCategory.entries()].map(
    ([categoryId, plannedAmount], index) => ({
      id: `horizon-month-${categoryId}`,
      user_id: "",
      plan_id: plan.id,
      category_id: categoryId,
      planned_amount: plannedAmount,
      sort_order: index,
      created_at: "",
    }),
  );

  return { plan, planItems };
}
