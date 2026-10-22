import { describe, expect, it } from "vitest";
import {
  applySandboxOverrides,
  overviewPeriodKey,
  parseMoneyInput,
  roundMoney,
} from "@/lib/plan/overview-sandbox";
import type { OverviewPeriodRow } from "@/lib/plan/overview-rates";

function row(
  partial: Pick<OverviewPeriodRow, "start" | "end" | "income" | "expense"> &
    Partial<OverviewPeriodRow>,
): OverviewPeriodRow {
  const income = partial.income;
  const expense = partial.expense;
  const difference = income - expense;

  return {
    label: partial.label ?? partial.start,
    difference,
    cumulativeDifference: partial.cumulativeDifference ?? difference,
    ...partial,
    income,
    expense,
  };
}

describe("overview sandbox", () => {
  it("rounds money to two decimals", () => {
    expect(roundMoney(10.006)).toBe(10.01);
    expect(roundMoney(Number.NaN)).toBe(0);
  });

  it("parses money inputs safely", () => {
    expect(parseMoneyInput("12.5")).toBe(12.5);
    expect(parseMoneyInput("")).toBe(0);
    expect(parseMoneyInput("abc")).toBe(0);
  });

  it("recomputes difference and cumulative after overrides", () => {
    const base = [
      row({ start: "2026-10-01", end: "2026-10-31", income: 100, expense: 40 }),
      row({ start: "2026-11-01", end: "2026-11-30", income: 100, expense: 60 }),
    ];

    const next = applySandboxOverrides(base, {
      [overviewPeriodKey(base[0])]: { income: 200, expense: 50 },
    });

    expect(next[0]).toMatchObject({
      income: 200,
      expense: 50,
      difference: 150,
      cumulativeDifference: 150,
    });
    expect(next[1]).toMatchObject({
      income: 100,
      expense: 60,
      difference: 40,
      cumulativeDifference: 190,
    });
  });
});
