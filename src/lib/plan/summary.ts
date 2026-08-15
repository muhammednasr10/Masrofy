import type { Locale } from "@/i18n/config";
import type { Category, MonthlyPlan, PlanComparison, PlanItem, Transaction } from "@/lib/types/database";
import { getMonthRange, isDateInMonthRange } from "@/lib/calendar";

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
  monthStartDay = 1,
  locale = "ar",
}: {
  categories: Category[];
  plan: MonthlyPlan | null;
  planItems: PlanItem[];
  transactions: Transaction[];
  referenceDate?: Date;
  monthStartDay?: number;
  locale?: Locale;
}): PlanComparison {
  const month = getMonthRange(referenceDate, locale, monthStartDay);
  const monthTransactions = transactions.filter((transaction) =>
    isDateInMonthRange(transaction.transaction_date, month),
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
