import { parseLocalDate } from "@/lib/calendar/dates";
import { isIncomeCategory } from "@/lib/categories/flow";
import type { Locale } from "@/i18n/config";
import {
  addDaysToDateKey,
  isDateKey,
  occurrenceCount,
  sumHorizonExpenses,
  type HorizonExpenseLine,
  type HorizonLineDraft,
} from "@/lib/plan/horizon";
import { isHorizonRollupParent } from "@/lib/plan/horizon-rollup";
import {
  daysInMonthContaining,
  endOfCalendarMonth,
  enumerateOverviewPeriods,
  maxDateKey,
  minDateKey,
  startOfCalendarMonth,
} from "@/lib/plan/overview-periods";
import {
  defaultOverviewRangeEnd,
  type OverviewPeriodRow,
  type OverviewView,
  type PlanOverviewSource,
} from "@/lib/plan/overview-types";
import type { Category } from "@/lib/types/database";

export function applyCurrentMonthActuals(
  rows: OverviewPeriodRow[],
  view: OverviewView,
  currentMonthStart: string,
  actualIncome: number,
  actualExpense: number,
): OverviewPeriodRow[] {
  if (view !== "monthly" || !isDateKey(currentMonthStart)) {
    return rows;
  }

  let cumulativeDifference = 0;

  return rows.map((row) => {
    const isCurrentPeriod = currentMonthStart >= row.start && currentMonthStart <= row.end;

    if (!isCurrentPeriod) {
      cumulativeDifference += row.difference;
      return {
        ...row,
        isCurrentPeriod: false,
        cumulativeDifference,
      };
    }

    const plannedIncome = row.income;
    const plannedExpense = row.expense;
    const plannedDifference = row.difference;
    const income = actualIncome;
    const expense = actualExpense;
    const difference = income - expense;
    cumulativeDifference += difference;

    return {
      ...row,
      income,
      expense,
      difference,
      cumulativeDifference,
      isCurrentPeriod: true,
      plannedIncome,
      plannedExpense,
      plannedDifference,
    };
  });
}

function collectHorizonLines(
  categories: Category[],
  lines: Record<string, HorizonLineDraft>,
  kind: "income" | "expense",
): HorizonExpenseLine[] {
  const result: HorizonExpenseLine[] = [];

  for (const category of categories) {
    const isIncome = isIncomeCategory(category);

    if (kind === "income" ? !isIncome : isIncome) {
      continue;
    }

    const line = lines[category.id];

    if (!line || !isDateKey(line.startDate) || !isDateKey(line.endDate)) {
      continue;
    }

    const amount = Number(line.amount || 0);

    if (
      !(amount > 0) ||
      line.endDate < line.startDate ||
      line.certainty === "contingent" ||
      isHorizonRollupParent(category.id, categories, lines)
    ) {
      continue;
    }

    result.push({
      amount,
      cadence: line.cadence,
      startDate: line.startDate,
      endDate: line.endDate,
    });
  }

  return result;
}

export function plannedIncomeInWindow(
  plannedMonthlyIncome: number,
  windowStart: string,
  windowEnd: string,
) {
  if (!(plannedMonthlyIncome > 0) || windowEnd < windowStart) {
    return 0;
  }

  let total = 0;
  let cursor = startOfCalendarMonth(windowStart);

  while (cursor <= windowEnd) {
    const monthEnd = endOfCalendarMonth(cursor);
    const overlapStart = maxDateKey(cursor, windowStart);
    const overlapEnd = minDateKey(monthEnd, windowEnd);

    if (overlapStart <= overlapEnd) {
      const overlapDays =
        Math.round(
          (parseLocalDate(overlapEnd).getTime() - parseLocalDate(overlapStart).getTime()) /
            86_400_000,
        ) + 1;
      total += plannedMonthlyIncome * (overlapDays / daysInMonthContaining(cursor));
    }

    cursor = addDaysToDateKey(monthEnd, 1);
  }

  return total;
}

export function buildPlanOverviewPeriodRows({
  categories,
  lines,
  plannedMonthlyIncome,
  view,
  rangeStart,
  rangeEnd,
  locale = "ar",
}: {
  categories: Category[];
  lines: Record<string, HorizonLineDraft>;
  plannedMonthlyIncome: number;
  view: OverviewView;
  rangeStart: string;
  rangeEnd: string;
  locale?: Locale;
}): OverviewPeriodRow[] {
  const expenseLines = collectHorizonLines(categories, lines, "expense");
  const incomeLines = collectHorizonLines(categories, lines, "income");
  const periods = enumerateOverviewPeriods(view, rangeStart, rangeEnd, locale);

  let cumulativeDifference = 0;

  return periods.map((period) => {
    const categoryIncome = sumHorizonExpenses(incomeLines, period.start, period.end);
    const plannedIncome = plannedIncomeInWindow(plannedMonthlyIncome, period.start, period.end);
    const income = Math.max(plannedIncome, categoryIncome);
    const expense = sumHorizonExpenses(expenseLines, period.start, period.end);
    const difference = income - expense;
    cumulativeDifference += difference;

    return {
      ...period,
      income,
      expense,
      difference,
      cumulativeDifference,
    };
  });
}

export function buildPlanOverviewTotals({
  categories,
  lines,
  plannedMonthlyIncome,
  view,
  rangeStart,
  rangeEnd,
}: {
  categories: Category[];
  lines: Record<string, HorizonLineDraft>;
  plannedMonthlyIncome: number;
  view: OverviewView;
  rangeStart?: string;
  rangeEnd?: string;
}) {
  const start = rangeStart && isDateKey(rangeStart) ? rangeStart : "1970-01-01";
  const end =
    rangeEnd && isDateKey(rangeEnd)
      ? rangeEnd
      : defaultOverviewRangeEnd(start === "1970-01-01" ? "2026-01-01" : start);

  const rows = buildPlanOverviewPeriodRows({
    categories,
    lines,
    plannedMonthlyIncome,
    view,
    rangeStart: start,
    rangeEnd: end,
  });

  const income = rows.reduce((total, row) => total + row.income, 0);
  const expense = rows.reduce((total, row) => total + row.expense, 0);

  return {
    income,
    expense,
    net: income - expense,
    rows,
  };
}

export function buildOverviewDisplayRows(
  source: PlanOverviewSource,
  view: OverviewView,
  rangeStart: string,
  rangeEnd: string,
): OverviewPeriodRow[] {
  if (!isDateKey(rangeStart) || !isDateKey(rangeEnd) || rangeEnd < rangeStart) {
    return [];
  }

  const plannedRows = buildPlanOverviewPeriodRows({
    categories: source.categories,
    lines: source.lines,
    plannedMonthlyIncome: source.plannedMonthlyIncome,
    view,
    rangeStart,
    rangeEnd,
  });

  return applyCurrentMonthActuals(
    plannedRows,
    view,
    source.currentMonthStart,
    source.actualMonthIncome,
    source.actualMonthExpense,
  );
}

export function countPlannedIncomeOccurrences(
  plannedMonthlyIncome: number,
  anchorDate: string,
  windowStart: string,
  windowEnd: string,
) {
  if (!(plannedMonthlyIncome > 0)) {
    return 0;
  }

  return (
    plannedMonthlyIncome *
    occurrenceCount("monthly", anchorDate, "9999-12-31", windowStart, windowEnd)
  );
}
