import { describe, expect, it } from "vitest";
import { buildDashboardAlerts } from "@/lib/alerts/dashboard";
import type { Translator } from "@/i18n/translate";
import type { PlanComparison, PlanComparisonRow } from "@/lib/types/database";

const t: Translator = (key, params) =>
  params ? `${key}:${JSON.stringify(params)}` : key;

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

function comparison(expenseRows: PlanComparisonRow[]): PlanComparison {
  return {
    monthLabel: "سبتمبر 2026",
    monthStart: "2026-09-01",
    monthEnd: "2026-09-30",
    hasPlan: true,
    income: { planned: 0, actual: 0, difference: 0 },
    expenses: { planned: 100, actual: 0, difference: 0 },
    balance: { planned: 0, actual: 0, difference: 0 },
    expenseRows,
    incomeRows: [],
    uncategorizedExpenses: 0,
  };
}

function categoryAlerts(expenseRows: PlanComparisonRow[]) {
  return buildDashboardAlerts({
    planComparison: comparison(expenseRows),
    investments: [],
    wallets: [],
    reconciliations: [],
    formatAmount: (value) => String(value),
    t,
  }).filter((alert) => alert.id.startsWith("category-budget-"));
}

describe("category budget alerts", () => {
  it("warns when a parent category reaches 80% of its plan", () => {
    const alerts = categoryAlerts([row({ actual: 80, difference: -20, progressPercent: 80 })]);

    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.tone).toBe("amber");
    expect(alerts[0]?.title).toContain("طعام");
    expect(alerts[0]?.description).toContain("80");
    expect(alerts[0]?.href).toBe("/plan?category=food");
  });

  it("marks a parent category red once spending passes the plan", () => {
    const alerts = categoryAlerts([row({ actual: 130, difference: 30, progressPercent: 100 })]);

    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.tone).toBe("red");
    expect(alerts[0]?.description).toContain("30");
  });

  it("stays quiet below 80% and keeps only the five closest categories", () => {
    const quiet = categoryAlerts([row({ actual: 79, difference: -21, progressPercent: 79 })]);
    expect(quiet).toHaveLength(0);

    const crowded = categoryAlerts(
      Array.from({ length: 6 }, (_, index) =>
        row({
          categoryId: `cat-${index}`,
          name: `فئة ${index}`,
          actual: 80 + index,
          planned: 100,
          progressPercent: 80 + index,
        }),
      ),
    );

    expect(crowded).toHaveLength(5);
    expect(crowded[0]?.id).toBe("category-budget-cat-5");
  });
});
