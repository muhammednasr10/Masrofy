import { describe, expect, it } from "vitest";
import { filterMonthComparisonExpenseRows } from "@/lib/plan/horizon-visibility";
import type { Category, PlanComparisonRow } from "@/lib/types/database";

const food: Category = {
  id: "food",
  user_id: "u",
  name: "طعام",
  icon: "🍔",
  color: "#000",
  parent_category_id: null,
  flow: "expense",
  sort_order: 1,
  created_at: "",
};

const salary: Category = {
  id: "salary",
  user_id: "u",
  name: "مرتب",
  icon: "💰",
  color: "#000",
  parent_category_id: null,
  flow: "income",
  sort_order: 2,
  created_at: "",
};

const emptyExpense: Category = {
  id: "fun",
  user_id: "u",
  name: "ترفيه",
  icon: "🎬",
  color: "#000",
  parent_category_id: null,
  flow: "expense",
  sort_order: 3,
  created_at: "",
};

describe("horizon visibility for month comparison", () => {
  it("keeps only expense categories that have horizon amounts", () => {
    const rows: PlanComparisonRow[] = [
      {
        categoryId: "food",
        name: "طعام",
        icon: "🍔",
        color: "#000",
        planned: 3000,
        actual: 100,
        difference: -2900,
        progressPercent: 3,
        children: [],
      },
      {
        categoryId: "salary",
        name: "مرتب",
        icon: "💰",
        color: "#000",
        planned: 0,
        actual: 0,
        difference: 0,
        progressPercent: null,
        children: [],
      },
      {
        categoryId: "fun",
        name: "ترفيه",
        icon: "🎬",
        color: "#000",
        planned: 0,
        actual: 0,
        difference: 0,
        progressPercent: null,
        children: [],
      },
    ];

    const filtered = filterMonthComparisonExpenseRows(rows, [food, salary, emptyExpense], {
      food: {
        amount: "3000",
        cadence: "monthly",
        certainty: "confirmed",
        startDate: "2026-10-01",
        endDate: "2027-09-30",
      },
      fun: {
        amount: "0",
        cadence: "monthly",
        certainty: "confirmed",
        startDate: "2026-10-01",
        endDate: "2027-09-30",
      },
    });

    expect(filtered.map((row) => row.categoryId)).toEqual(["food"]);
  });
});
