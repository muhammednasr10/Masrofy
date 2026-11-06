import { describe, expect, it } from "vitest";
import type { Category } from "@/lib/types/database";
import { splitCategoryPath } from "@/lib/categories/hierarchy";

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

describe("splitCategoryPath", () => {
  it("keeps the root separate from joined subcategory branches", () => {
    const groceries = makeCategory({ id: "groceries" });
    const tea = makeCategory({
      id: "tea",
      name: "شاي",
      icon: "🍵",
      parent_category_id: "groceries",
    });

    expect(splitCategoryPath(tea, [groceries, tea])).toEqual({
      root: expect.objectContaining({ id: "groceries", name: "عطارة" }),
      branches: [expect.objectContaining({ id: "tea", name: "شاي" })],
    });
  });
});
