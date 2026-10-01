import type { PlanComparison, PlanComparisonRow } from "@/lib/types/database";

export type ClosestCategory = {
  categoryId: string;
  name: string;
  icon: string;
  percent: number;
  over: boolean;
};

export type MonthSpendLeft =
  | { hasPlan: false }
  | {
      hasPlan: true;
      remaining: number;
      closest: ClosestCategory | null;
    };

export function getMonthSpendLeft(comparison: PlanComparison): MonthSpendLeft {
  if (!comparison.hasPlan) {
    return { hasPlan: false };
  }

  const closestRow = comparison.expenseRows
    .filter((row) => row.planned > 0 && row.actual > 0)
    .sort((left, right) => right.actual / right.planned - left.actual / left.planned)[0];

  return {
    hasPlan: true,
    remaining: comparison.expenses.planned - comparison.expenses.actual,
    closest: closestRow ? toClosestCategory(closestRow) : null,
  };
}

function toClosestCategory(row: PlanComparisonRow): ClosestCategory {
  return {
    categoryId: row.categoryId,
    name: row.name,
    icon: row.icon,
    percent: Math.round((row.actual / row.planned) * 100),
    over: row.actual > row.planned,
  };
}
