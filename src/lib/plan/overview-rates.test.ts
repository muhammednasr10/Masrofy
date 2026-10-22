import { describe, expect, it } from "vitest";
import {
  applyCurrentMonthActuals,
  buildPlanOverviewPeriodRows,
  convertCadenceAmount,
  enumerateOverviewPeriods,
  isPlanIncomeCategory,
  plannedIncomeInWindow,
} from "@/lib/plan/overview-rates";

describe("overview rates", () => {
  it("converts cadence amounts into the selected overview view", () => {
    expect(convertCadenceAmount(3000, "monthly", "monthly")).toBe(3000);
    expect(convertCadenceAmount(36000, "yearly", "monthly")).toBe(3000);
    expect(convertCadenceAmount(100, "daily", "yearly")).toBeCloseTo(36500, 5);
    expect(convertCadenceAmount(700, "weekly", "monthly")).toBeCloseTo(700 * (52 / 12), 5);
  });

  it("uses flow to distinguish income categories", () => {
    expect(isPlanIncomeCategory({ name: "راتب", flow: "income" })).toBe(true);
    expect(isPlanIncomeCategory({ name: "إيراد غير معروف" })).toBe(true);
    expect(isPlanIncomeCategory({ name: "طعام", flow: "expense" })).toBe(false);
  });

  it("enumerates monthly periods inside the selected range", () => {
    const periods = enumerateOverviewPeriods("monthly", "2026-10-01", "2026-12-31", "en");

    expect(periods).toHaveLength(3);
    expect(periods[0]).toMatchObject({ start: "2026-10-01", end: "2026-10-31" });
    expect(periods[2]).toMatchObject({ start: "2026-12-01", end: "2026-12-31" });
  });

  it("prorates planned monthly income inside a window", () => {
    expect(plannedIncomeInWindow(31000, "2026-10-01", "2026-10-31")).toBe(31000);
    expect(plannedIncomeInWindow(31000, "2026-10-01", "2026-10-10")).toBeCloseTo(10000, 5);
  });

  it("builds period rows with cumulative difference", () => {
    const rows = buildPlanOverviewPeriodRows({
      categories: [
        {
          id: "food",
          user_id: "u",
          name: "طعام",
          icon: "🍔",
          color: "#000",
          parent_category_id: null,
          flow: "expense",
          sort_order: 1,
          created_at: "",
        },
      ],
      lines: {
        food: {
          amount: "3000",
          cadence: "monthly",
          certainty: "confirmed",
          startDate: "2026-10-01",
          endDate: "2026-12-31",
        },
      },
      plannedMonthlyIncome: 19000,
      view: "monthly",
      rangeStart: "2026-10-01",
      rangeEnd: "2026-11-30",
      locale: "en",
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      income: 19000,
      expense: 3000,
      difference: 16000,
      cumulativeDifference: 16000,
    });
    expect(rows[1]).toMatchObject({
      income: 19000,
      expense: 3000,
      difference: 16000,
      cumulativeDifference: 32000,
    });
  });

  it("excludes contingent horizon lines from overview totals", () => {
    const rows = buildPlanOverviewPeriodRows({
      categories: [
        {
          id: "bonus",
          user_id: "u",
          name: "إضافي",
          icon: "💰",
          color: "#000",
          parent_category_id: null,
          flow: "income",
          sort_order: 1,
          created_at: "",
        },
      ],
      lines: {
        bonus: {
          amount: "5000",
          cadence: "monthly",
          certainty: "contingent",
          startDate: "2026-10-01",
          endDate: "2026-12-31",
        },
      },
      plannedMonthlyIncome: 0,
      view: "monthly",
      rangeStart: "2026-10-01",
      rangeEnd: "2026-10-31",
      locale: "en",
    });

    expect(rows[0]).toMatchObject({ income: 0, expense: 0 });
  });

  it("replaces the open month with actual income and expense", () => {
    const planned = buildPlanOverviewPeriodRows({
      categories: [],
      lines: {},
      plannedMonthlyIncome: 19000,
      view: "monthly",
      rangeStart: "2026-10-01",
      rangeEnd: "2026-11-30",
      locale: "en",
    });

    const rows = applyCurrentMonthActuals(planned, "monthly", "2026-10-01", 15000, 20000);

    expect(rows[0]).toMatchObject({
      isCurrentPeriod: true,
      income: 15000,
      expense: 20000,
      difference: -5000,
      plannedIncome: 19000,
      plannedExpense: 0,
      plannedDifference: 19000,
      cumulativeDifference: -5000,
    });
    expect(rows[1]?.cumulativeDifference).toBe(-5000 + (rows[1]?.difference ?? 0));
  });
});
