import type { Locale } from "@/i18n/config";
import { getCategoryDescendantIds, getParentCategories } from "@/lib/categories/hierarchy";
import { buildComparisonChildren } from "@/lib/plan/comparison-children";
import type {
  Category,
  MonthlyPlan,
  PlanComparison,
  PlanItem,
  Transaction,
} from "@/lib/types/database";
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
  const incomeActualByCategory = new Map<string, number>();
  let actualIncome = 0;
  let actualExpenses = 0;
  let uncategorizedExpenses = 0;
  let uncategorizedIncome = 0;

  for (const transaction of monthTransactions) {
    const amount = Number(transaction.amount);

    if (transaction.type === "income") {
      actualIncome += amount;

      if (transaction.category_id) {
        incomeActualByCategory.set(
          transaction.category_id,
          (incomeActualByCategory.get(transaction.category_id) ?? 0) + amount,
        );
      } else {
        uncategorizedIncome += amount;
      }

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

  const expenseRows = getParentCategories(categories)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ar"))
    .map((category) => {
      const categoryIds = [category.id, ...getCategoryDescendantIds(category.id, categories)];
      const planned = categoryIds.reduce(
        (total, categoryId) => total + (plannedByCategory.get(categoryId) ?? 0),
        0,
      );
      const actual = categoryIds.reduce(
        (total, categoryId) => total + (actualByCategory.get(categoryId) ?? 0),
        0,
      );

      return {
        categoryId: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
        planned,
        actual,
        difference: actual - planned,
        progressPercent: planned > 0 ? Math.min(100, (actual / planned) * 100) : null,
        children: buildComparisonChildren(category, categories, plannedByCategory, actualByCategory),
      };
    });

  expenseRows.sort((left, right) => {
    if (right.planned !== left.planned) {
      return right.planned - left.planned;
    }

    return right.actual - left.actual;
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
    incomeRows: [
      {
        categoryId: "income",
        name: "الدخل",
        icon: "💰",
        color: "#059669",
        planned: plannedIncome,
        actual: actualIncome,
        difference: actualIncome - plannedIncome,
        progressPercent: plannedIncome > 0 ? Math.min(100, (actualIncome / plannedIncome) * 100) : null,
        children: buildIncomeSourceRows(categories, incomeActualByCategory, uncategorizedIncome),
      },
    ],
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
  return rollCategoryPlansToParents(categories, buildCategoryPlanMap(planItems));
}

export function rollCategoryPlansToParents(
  categories: Category[],
  plannedByCategory: Map<string, number>,
) {
  const plans = Object.fromEntries(categories.map((category) => [category.id, ""])) as Record<
    string,
    string
  >;

  for (const category of getParentCategories(categories)) {
    const categoryIds = [category.id, ...getCategoryDescendantIds(category.id, categories)];
    const total = categoryIds.reduce(
      (sum, categoryId) => sum + (plannedByCategory.get(categoryId) ?? 0),
      0,
    );
    plans[category.id] = total > 0 ? String(total) : "";
  }

  return plans;
}

function buildIncomeSourceRows(
  categories: Category[],
  incomeActualByCategory: Map<string, number>,
  uncategorizedIncome: number,
) {
  const sources = getParentCategories(categories)
    .map((category) => {
      const categoryIds = [category.id, ...getCategoryDescendantIds(category.id, categories)];
      const actual = categoryIds.reduce(
        (total, categoryId) => total + (incomeActualByCategory.get(categoryId) ?? 0),
        0,
      );

      return {
        categoryId: category.id,
        name: category.name,
        icon: category.icon,
        planned: 0,
        actual,
      };
    })
    .filter((row) => row.actual > 0);

  if (uncategorizedIncome > 0) {
    sources.push({
      categoryId: "income:uncategorized",
      name: "بدون فئة",
      icon: "💰",
      planned: 0,
      actual: uncategorizedIncome,
    });
  }

  return sources.sort((left, right) => right.actual - left.actual);
}
