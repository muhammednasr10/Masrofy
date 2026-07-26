import { describe, expect, it } from "vitest";
import { summarizeTransactions } from "@/lib/utils/summary";
import { makeTransaction } from "@/test/factories";

describe("summarizeTransactions", () => {
  it("totals income and expenses while ignoring transfers", () => {
    const summary = summarizeTransactions([
      makeTransaction({ type: "income", amount: 1000 }),
      makeTransaction({ id: "tx-2", type: "expense", amount: 300 }),
      makeTransaction({ id: "tx-3", type: "expense", amount: 200 }),
      makeTransaction({
        id: "tx-4",
        type: "transfer",
        transfer_role: "out",
        amount: 500,
        category_id: null,
      }),
    ]);

    expect(summary.totalIncome).toBe(1000);
    expect(summary.totalExpenses).toBe(500);
    expect(summary.balance).toBe(500);
  });

  it("groups expenses by category and sorts by highest total", () => {
    const summary = summarizeTransactions([
      makeTransaction({
        id: "tx-food",
        category_id: "cat-food",
        amount: 120,
        categories: { name: "طعام", icon: "🍔", color: "#f97316" },
      }),
      makeTransaction({
        id: "tx-bills",
        category_id: "cat-bills",
        amount: 300,
        categories: { name: "فواتير", icon: "💡", color: "#eab308" },
      }),
      makeTransaction({
        id: "tx-food-2",
        category_id: "cat-food",
        amount: 80,
        categories: { name: "طعام", icon: "🍔", color: "#f97316" },
      }),
    ]);

    expect(summary.byCategory).toHaveLength(2);
    expect(summary.byCategory[0]?.name).toBe("فواتير");
    expect(summary.byCategory[0]?.total).toBe(300);
    expect(summary.byCategory[1]?.name).toBe("طعام");
    expect(summary.byCategory[1]?.total).toBe(200);
  });

  it("uses uncategorized defaults when category metadata is missing", () => {
    const summary = summarizeTransactions([
      makeTransaction({ category_id: null, amount: 75 }),
    ]);

    expect(summary.byCategory).toEqual([
      {
        categoryId: null,
        name: "بدون فئة",
        icon: "📦",
        color: "#64748b",
        total: 75,
      },
    ]);
  });
});
