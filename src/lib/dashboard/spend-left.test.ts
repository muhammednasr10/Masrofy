import { describe, expect, it } from "vitest";
import { getMonthSpendLeft } from "@/lib/dashboard/spend-left";
import type { PlanComparison, PlanComparisonRow } from "@/lib/types/database";

function row(overrides: Partial<PlanComparisonRow>): PlanComparisonRow {
  return {
    categoryId: "food",
    name: "طعام",
    icon: "🍔",
    color: "#f97316",
    planned: 100,
    actual: 0,
    difference: -100,
    progressPercent: 0,
    ...overrides,
  };
}

function comparison(overrides: Partial<PlanComparison> = {}): PlanComparison {
  return {
    monthLabel: "سبتمبر 2026",
    monthStart: "2026-09-01",
    monthEnd: "2026-09-30",
    hasPlan: true,
    income: { planned: 0, actual: 0, difference: 0 },
    expenses: { planned: 200, actual: 80, difference: -120 },
    balance: { planned: 0, actual: 0, difference: 0 },
    expenseRows: [],
    incomeRows: [],
    uncategorizedExpenses: 0,
    ...overrides,
  };
}

describe("getMonthSpendLeft", () => {
  it("stays quiet when the month has no plan", () => {
    expect(getMonthSpendLeft(comparison({ hasPlan: false })).hasPlan).toBe(false);
  });

  it("reports what is left and the category closest to its limit", () => {
    const result = getMonthSpendLeft(
      comparison({
        expenseRows: [
          row({ categoryId: "food", name: "طعام", actual: 50, planned: 100 }),
          row({ categoryId: "bills", name: "فواتير", icon: "💡", actual: 90, planned: 100 }),
        ],
      }),
    );

    expect(result).toMatchObject({
      hasPlan: true,
      remaining: 120,
      closest: { categoryId: "bills", name: "فواتير", percent: 90, over: false },
    });
  });

  it("marks a category that already passed its budget", () => {
    const result = getMonthSpendLeft(
      comparison({
        expenses: { planned: 100, actual: 140, difference: 40 },
        expenseRows: [row({ actual: 140, planned: 100, progressPercent: 100 })],
      }),
    );

    expect(result).toMatchObject({
      remaining: -40,
      closest: { percent: 140, over: true },
    });
  });
});
