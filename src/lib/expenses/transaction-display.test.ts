import { describe, expect, it } from "vitest";
import type { Category } from "@/lib/types/database";
import { getTransactionCategoryColumns } from "@/lib/expenses/transaction-display";
import { makeTransaction } from "@/test/factories";

const messages = {
  typeIncome: "دخل",
  typeTransfer: "تحويل",
  noCategory: "بدون فئة",
};

function makeCategory(overrides: Partial<Category>): Category {
  return {
    id: "cat-1",
    user_id: "user-1",
    name: "عطارة",
    icon: "🌿",
    color: "#22c55e",
    parent_category_id: null,
    flow: "expense",
    sort_order: 1,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("getTransactionCategoryColumns", () => {
  const groceries = makeCategory({ id: "groceries", name: "عطارة", icon: "🌿" });
  const spices = makeCategory({
    id: "spices",
    name: "بهارات",
    icon: "🧂",
    parent_category_id: "groceries",
  });
  const tea = makeCategory({
    id: "tea",
    name: "شاي",
    icon: "🍵",
    parent_category_id: "spices",
  });
  const categories = [groceries, spices, tea];

  it("puts the root in the main column and joins nested subcategories", () => {
    expect(
      getTransactionCategoryColumns(
        makeTransaction({ category_id: "tea" }),
        categories,
        messages,
      ),
    ).toEqual({
      mainLabel: "🌿 عطارة",
      subLabel: "🧂 بهارات › 🍵 شاي",
    });
  });

  it("shows a dash in the category column when the transaction is on the main category", () => {
    expect(
      getTransactionCategoryColumns(
        makeTransaction({ category_id: "groceries" }),
        categories,
        messages,
      ),
    ).toEqual({
      mainLabel: "🌿 عطارة",
      subLabel: "—",
    });
  });
});
