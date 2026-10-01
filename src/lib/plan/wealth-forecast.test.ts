import { describe, expect, it } from "vitest";
import { buildPlanWealthForecast, monthsLeftInPlanYear } from "@/lib/plan/wealth-forecast";
import { makeTransaction, makeWallet } from "@/test/factories";

describe("buildPlanWealthForecast", () => {
  const wallet = makeWallet({ opening_balance: 5000 });

  it("starts the month before its transactions and projects the saved month plan", () => {
    const forecast = buildPlanWealthForecast({
      wallets: [wallet],
      transactionsBeforeMonth: [makeTransaction({ amount: 500, transaction_date: "2026-09-10" })],
      monthPlanNet: 1800,
      annualPlannedIncome: 19000,
      annualPlannedExpenses: 17200,
      planMonthKey: "2026-10",
      planYear: 2026,
    });

    expect(forecast.monthStart).toBe(4500);
    expect(forecast.expectedMonthEnd).toBe(6300);
    expect(forecast.monthsLeftInYear).toBe(3);
    expect(forecast.expectedYearEnd).toBe(9900);
  });

  it("leaves the year forecast empty when there is no annual plan", () => {
    const forecast = buildPlanWealthForecast({
      wallets: [wallet],
      transactionsBeforeMonth: [],
      monthPlanNet: 100,
      annualPlannedIncome: null,
      annualPlannedExpenses: null,
      planMonthKey: "2026-12",
      planYear: 2026,
    });

    expect(forecast.expectedYearEnd).toBeNull();
    expect(monthsLeftInPlanYear("2026-12", 2026)).toBe(1);
  });
});
