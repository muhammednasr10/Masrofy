import { describe, expect, it } from "vitest";
import { buildDailyMonthSummary } from "@/lib/expenses/daily-month-summary";

describe("buildDailyMonthSummary", () => {
  it("fills every day and totals income, expense, and net", () => {
    const summary = buildDailyMonthSummary(
      [
        { type: "income", amount: 100, transaction_date: "2026-11-01" },
        { type: "expense", amount: 40, transaction_date: "2026-11-01" },
        { type: "expense", amount: 10, transaction_date: "2026-11-03" },
        { type: "transfer", amount: 999, transaction_date: "2026-11-02" },
      ],
      "2026-11-01",
      "2026-11-03",
    );

    expect(summary.days).toHaveLength(3);
    expect(summary.days[0]).toEqual({
      date: "2026-11-01",
      income: 100,
      expense: 40,
      net: 60,
    });
    expect(summary.days[2]).toEqual({
      date: "2026-11-03",
      income: 0,
      expense: 10,
      net: -10,
    });
    expect(summary.totalIncome).toBe(100);
    expect(summary.totalExpense).toBe(50);
    expect(summary.totalNet).toBe(50);
  });
});
