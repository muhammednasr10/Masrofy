import { describe, expect, it } from "vitest";
import { buildHorizonMonthPlan, monthlyAmountInWindow } from "@/lib/plan/month-from-horizon";
import type { HorizonLineDraft } from "@/lib/plan/horizon";
import type { Category } from "@/lib/types/database";

function line(patch: Partial<HorizonLineDraft>): HorizonLineDraft {
  return {
    amount: "5000",
    cadence: "monthly",
    certainty: "confirmed",
    startDate: "2026-01-15",
    endDate: "2026-12-14",
    ...patch,
  };
}

function category(id: string, flow: "income" | "expense", parent: string | null = null): Category {
  return {
    id,
    user_id: "u",
    name: id,
    icon: "•",
    color: "#000",
    parent_category_id: parent,
    flow,
    sort_order: 1,
    created_at: "",
  };
}

describe("monthly amount inside the current month window", () => {
  it("counts one monthly occurrence when the anchor day falls in the window", () => {
    expect(monthlyAmountInWindow(line({}), "2026-11-01", "2026-11-30")).toBe(5000);
  });

  it("skips the month when the anchor day is outside the window", () => {
    expect(monthlyAmountInWindow(line({}), "2026-11-01", "2026-11-10")).toBe(0);
  });

  it("counts an ongoing line when the month is after the start", () => {
    expect(monthlyAmountInWindow(line({ endDate: "" }), "2026-11-01", "2026-11-30")).toBe(5000);
  });

  it("skips a period that already ended", () => {
    expect(
      monthlyAmountInWindow(line({ endDate: "2026-10-31" }), "2026-11-01", "2026-11-30"),
    ).toBe(0);
  });

  it("ignores weekly and contingent lines", () => {
    expect(monthlyAmountInWindow(line({ cadence: "weekly" }), "2026-11-01", "2026-11-30")).toBe(0);
    expect(
      monthlyAmountInWindow(line({ certainty: "contingent" }), "2026-11-01", "2026-11-30"),
    ).toBe(0);
  });

  it("uses child monthly amounts and sums income for the month", () => {
    const food = category("food", "expense");
    const market = category("market", "expense", "food");
    const salary = category("salary", "income");
    const plan = buildHorizonMonthPlan(
      [food, market, salary],
      {
        food: line({ amount: "9000" }),
        market: line({ amount: "2000" }),
        salary: line({ amount: "12000" }),
      },
      "2026-11-01",
      "2026-11-30",
    );

    expect(plan.usesHorizon).toBe(true);
    expect(plan.plannedByCategory.get("food")).toBeUndefined();
    expect(plan.plannedByCategory.get("market")).toBe(2000);
    expect(plan.plannedIncome).toBe(12000);
  });
});
