import type { OverviewPeriodRow } from "@/lib/plan/overview-rates";

export type PeriodOverride = {
  income: number;
  expense: number;
};

export function overviewPeriodKey(row: Pick<OverviewPeriodRow, "start" | "end">) {
  return `${row.start}:${row.end}`;
}

export function roundMoney(value: number) {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

/** Apply local income/expense edits and recompute difference + cumulative. */
export function applySandboxOverrides(
  baseRows: OverviewPeriodRow[],
  overrides: Record<string, PeriodOverride>,
): OverviewPeriodRow[] {
  let cumulativeDifference = 0;

  return baseRows.map((row) => {
    const override = overrides[overviewPeriodKey(row)];
    const income = roundMoney(override ? override.income : row.income);
    const expense = roundMoney(override ? override.expense : row.expense);
    const difference = income - expense;
    cumulativeDifference += difference;

    return {
      ...row,
      income,
      expense,
      difference,
      cumulativeDifference,
      isCurrentPeriod: false,
      plannedIncome: undefined,
      plannedExpense: undefined,
      plannedDifference: undefined,
    };
  });
}

export function parseMoneyInput(raw: string) {
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}
