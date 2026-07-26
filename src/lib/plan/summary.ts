import type { Category, MonthlyPlan, PlanComparison, PlanItem, Transaction } from "@/lib/types/database";
import { getMonthRange } from "@/lib/utils/format";

export function getPlanMonthKey(referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function parsePlanMonthKey(planMonthKey: string) {
  const [year, month] = planMonthKey.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

export function shiftPlanMonthKey(planMonthKey: string, offset: number) {
  const date = parsePlanMonthKey(planMonthKey);
  date.setMonth(date.getMonth() + offset);
  return getPlanMonthKey(date);
}

export function buildCategoryPlanMap(planItems: PlanItem[]) {
  const map = new Map<string, number>();

  for (const item of planItems) {
    map.set(item.category_id, Number(item.planned_amount));
  }

  return map;
}

export function buildPlanComparison({
  categories,
  plan,
  planItems,
  transactions,
  referenceDate = new Date(),
}: {
  categories: Category[];
  plan: MonthlyPlan | null;
  planItems: PlanItem[];
  transactions: Transaction[];
  referenceDate?: Date;
}): PlanComparison {
  const month = getMonthRange(referenceDate);
  const monthTransactions = transactions.filter(
    (transaction) =>
      transaction.transaction_date >= month.start &&
      transaction.transaction_date <= month.end,
  );

  const plannedByCategory = buildCategoryPlanMap(planItems);
  const actualByCategory = new Map<string, number>();
  let actualIncome = 0;
  let actualExpenses = 0;
  let uncategorizedExpenses = 0;

  for (const transaction of monthTransactions) {
    const amount = Number(transaction.amount);

    if (transaction.type === "income") {
      actualIncome += amount;
      continue;
    }

    actualExpenses += amount;

    if (transaction.category_id) {
      actualByCategory.set(
        transaction.category_id,
        (actualByCategory.get(transaction.category_id) ?? 0) + amount,
      );
    } else {
      uncategorizedExpenses += amount;
    }
  }

  const expenseRows = categories.map((category) => {
    const planned = plannedByCategory.get(category.id) ?? 0;
    const actual = actualByCategory.get(category.id) ?? 0;
    const difference = actual - planned;

    return {
      categoryId: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      planned,
      actual,
      difference,
      progressPercent: planned > 0 ? Math.min(100, (actual / planned) * 100) : null,
    };
  });

  expenseRows.sort((a, b) => {
    if (b.planned !== a.planned) {
      return b.planned - a.planned;
    }

    return b.actual - a.actual;
  });

  const plannedIncome = Number(plan?.planned_income ?? 0);
  const plannedExpenses = expenseRows.reduce((total, row) => total + row.planned, 0);

  return {
    monthLabel: month.label,
    monthStart: month.start,
    monthEnd: month.end,
    hasPlan: Boolean(plan),
    income: {
      planned: plannedIncome,
      actual: actualIncome,
      difference: actualIncome - plannedIncome,
    },
    expenses: {
      planned: plannedExpenses,
      actual: actualExpenses,
      difference: actualExpenses - plannedExpenses,
    },
    balance: {
      planned: plannedIncome - plannedExpenses,
      actual: actualIncome - actualExpenses,
      difference: actualIncome - actualExpenses - (plannedIncome - plannedExpenses),
    },
    expenseRows,
    uncategorizedExpenses,
  };
}

export function emptyCategoryPlans(categories: Category[]) {
  return Object.fromEntries(categories.map((category) => [category.id, ""])) as Record<
    string,
    string
  >;
}

export function categoryPlansFromItems(categories: Category[], planItems: PlanItem[]) {
  const plannedByCategory = buildCategoryPlanMap(planItems);
  return Object.fromEntries(
    categories.map((category) => [
      category.id,
      plannedByCategory.has(category.id) ? String(plannedByCategory.get(category.id)) : "",
    ]),
  ) as Record<string, string>;
}
