import { describe, expect, it } from "vitest";
import { collectDuePlanLines, expectedDateThisMonth, isExpectedDayDue } from "@/lib/plan/expected-day";
import type { HorizonLineDraft } from "@/lib/plan/horizon";
import type { Category } from "@/lib/types/database";

describe("plan expected day", () => {
  const today = new Date(2026, 10, 20);

  it("uses the chosen day once that day has arrived", () => {
    expect(isExpectedDayDue({
      expectedDay: 15,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      today,
    })).toBe("2026-11-15");
  });

  it("waits until the day arrives", () => {
    expect(isExpectedDayDue({
      expectedDay: 25,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      today,
    })).toBeNull();
  });

  it("clamps day 31 to the last day of a short month", () => {
    expect(expectedDateThisMonth(new Date(2026, 1, 10), 31)).toBe("2026-02-28");
  });

  it("keeps asking an ongoing line after the start date", () => {
    expect(isExpectedDayDue({
      expectedDay: 15,
      startDate: "2026-01-01",
      endDate: "",
      today,
    })).toBe("2026-11-15");
  });

  it("skips a day outside the plan period", () => {
    expect(isExpectedDayDue({
      expectedDay: 15,
      startDate: "2026-11-18",
      endDate: "2026-12-31",
      today,
    })).toBeNull();
  });

  it("asks for income and expense lines and skips rollup parents", () => {
    const parent = {
      id: "parent",
      user_id: "u",
      name: "أقساط",
      icon: "📅",
      color: "#000",
      parent_category_id: null,
      flow: "expense",
      sort_order: 1,
      created_at: "",
    } as Category;
    const child = { ...parent, id: "child", name: "قسط", parent_category_id: "parent" };
    const income = { ...parent, id: "salary", name: "راتب", flow: "income" as const, parent_category_id: null };
    const line = (expectedDay: string): HorizonLineDraft => ({
      amount: "1000",
      cadence: "monthly",
      certainty: "confirmed",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      expectedDay,
    });

    const due = collectDuePlanLines(
      [parent, child, income],
      { parent: line("10"), child: line("10"), salary: line("20") },
      today,
      {},
    );

    expect(due.map((item) => item.categoryId)).toEqual(["child", "salary"]);
    expect(due.map((item) => item.flow)).toEqual(["expense", "income"]);
  });
});
