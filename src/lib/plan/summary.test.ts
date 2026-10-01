import { describe, expect, it } from "vitest";
import type { Category, PlanItem, Transaction } from "@/lib/types/database";
import { buildPlanComparison, categoryPlansFromItems } from "@/lib/plan/summary";

const parent: Category = {
  id: "food",
  user_id: "user-1",
  name: "طعام",
  icon: "🍔",
  color: "#f97316",
  parent_category_id: null,
  sort_order: 1,
  created_at: "2026-01-01T00:00:00.000Z",
};

const child: Category = {
  ...parent,
  id: "groceries",
  name: "بقالة",
  parent_category_id: "food",
  sort_order: 2,
};

describe("plan category rollup", () => {
  it("shows only parent categories and folds child spending into them", () => {
    const comparison = buildPlanComparison({
      categories: [parent, child],
      plan: null,
      planItems: [
        { category_id: "food", planned_amount: 100 },
        { category_id: "groceries", planned_amount: 40 },
      ] as PlanItem[],
      transactions: [
        {
          category_id: "groceries",
          amount: 25,
          type: "expense",
          transaction_date: "2026-09-15",
        },
      ] as Transaction[],
      referenceDate: new Date("2026-09-15T12:00:00.000Z"),
      monthStartDay: 1,
    });

    expect(comparison.expenseRows).toHaveLength(1);
    expect(comparison.expenseRows[0]).toMatchObject({
      categoryId: "food",
      name: "طعام",
      planned: 140,
      actual: 25,
      children: [
        {
          categoryId: "groceries",
          name: "بقالة",
          planned: 40,
          actual: 25,
        },
      ],
    });
  });

  it("keeps spending recorded on the parent visible beside its children", () => {
    const comparison = buildPlanComparison({
      categories: [parent, child],
      plan: null,
      planItems: [],
      transactions: [
        {
          category_id: "food",
          amount: 10,
          type: "expense",
          transaction_date: "2026-09-10",
        },
        {
          category_id: "groceries",
          amount: 25,
          type: "expense",
          transaction_date: "2026-09-15",
        },
      ] as Transaction[],
      referenceDate: new Date("2026-09-15T12:00:00.000Z"),
      monthStartDay: 1,
    });

    expect(comparison.expenseRows[0]?.children).toEqual([
      {
        categoryId: "food:direct",
        name: "على الفئة نفسها",
        icon: "🍔",
        planned: 0,
        actual: 10,
      },
      {
        categoryId: "groceries",
        name: "بقالة",
        icon: "🍔",
        planned: 0,
        actual: 25,
      },
    ]);
  });

  it("lists the larger planned amount before a smaller one", () => {
    const rent: Category = {
      ...parent,
      id: "rent",
      name: "إيجار",
      icon: "🏠",
      sort_order: 0,
    };

    const comparison = buildPlanComparison({
      categories: [rent, parent],
      plan: null,
      planItems: [
        { category_id: "rent", planned_amount: 1000 },
        { category_id: "food", planned_amount: 100 },
      ] as PlanItem[],
      transactions: [
        {
          category_id: "rent",
          amount: 100,
          type: "expense",
          transaction_date: "2026-09-02",
        },
        {
          category_id: "food",
          amount: 90,
          type: "expense",
          transaction_date: "2026-09-12",
        },
      ] as Transaction[],
      referenceDate: new Date("2026-09-15T12:00:00.000Z"),
      monthStartDay: 1,
    });

    expect(comparison.expenseRows.map((row) => row.categoryId)).toEqual(["rent", "food"]);
  });

  it("keeps income in its own row and lists the categories it came from", () => {
    const comparison = buildPlanComparison({
      categories: [parent],
      plan: { planned_income: 19000 } as never,
      planItems: [],
      transactions: [
        {
          category_id: "food",
          amount: 4000,
          type: "income",
          transaction_date: "2026-09-05",
        },
        {
          category_id: null,
          amount: 15000,
          type: "income",
          transaction_date: "2026-09-01",
        },
      ] as Transaction[],
      referenceDate: new Date("2026-09-15T12:00:00.000Z"),
      monthStartDay: 1,
    });

    expect(comparison.incomeRows).toHaveLength(1);
    expect(comparison.incomeRows[0]).toMatchObject({
      categoryId: "income",
      planned: 19000,
      actual: 19000,
    });
    expect(comparison.incomeRows[0]?.children).toEqual([
      {
        categoryId: "income:uncategorized",
        name: "بدون فئة",
        icon: "💰",
        planned: 0,
        actual: 15000,
      },
      {
        categoryId: "food",
        name: "طعام",
        icon: "🍔",
        planned: 0,
        actual: 4000,
      },
    ]);
    expect(comparison.expenseRows[0]?.actual).toBe(0);
  });

  it("puts a child budget on the parent field in the plan editor state", () => {
    const plans = categoryPlansFromItems(
      [parent, child],
      [{ category_id: "groceries", planned_amount: 40 }] as PlanItem[],
    );

    expect(plans.food).toBe("40");
    expect(plans.groceries).toBe("");
  });
});
