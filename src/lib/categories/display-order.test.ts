import { describe, expect, it } from "vitest";
import {
  compareCategoriesForDisplay,
  compareWithTrailingNamesLast,
} from "@/lib/categories/display-order";

describe("category display order", () => {
  it("keeps unknown and other categories at the end", () => {
    const names = ["طعام", "أخرى", "ترفيه", "مصروف غير معروف", "إيراد غير معروف"];
    const sorted = [...names]
      .map((name, index) => ({ name, sort_order: index + 1 }))
      .sort(compareCategoriesForDisplay)
      .map((item) => item.name);

    expect(sorted).toEqual(["طعام", "ترفيه", "إيراد غير معروف", "مصروف غير معروف", "أخرى"]);
  });

  it("keeps trailing names last when sorting by amount", () => {
    const rows = [
      { name: "أخرى", amount: 9000 },
      { name: "طعام", amount: 1000 },
      { name: "مصروف غير معروف", amount: 5000 },
      { name: "ترفيه", amount: 2000 },
    ].sort((left, right) =>
      compareWithTrailingNamesLast(left.name, right.name, right.amount - left.amount),
    );

    expect(rows.map((row) => row.name)).toEqual([
      "ترفيه",
      "طعام",
      "مصروف غير معروف",
      "أخرى",
    ]);
  });
});
