import { getCategoryDescendantIds } from "@/lib/categories/hierarchy";
import { isExpenseCategory } from "@/lib/categories/flow";
import type { HorizonLineDraft } from "@/lib/plan/horizon";
import { monthlyAmountInWindow } from "@/lib/plan/month-from-horizon";
import type { Category, PlanComparisonRow } from "@/lib/types/database";

export function categoryHasMonthlyAmountInWindow(
  categoryId: string,
  categories: Category[],
  lines: Record<string, HorizonLineDraft>,
  windowStart: string,
  windowEnd: string,
) {
  const ids = [categoryId, ...getCategoryDescendantIds(categoryId, categories)];
  return ids.some((id) => monthlyAmountInWindow(lines[id], windowStart, windowEnd) > 0);
}

export function filterMonthComparisonExpenseRows(
  expenseRows: PlanComparisonRow[],
  categories: Category[],
  lines: Record<string, HorizonLineDraft>,
  windowStart: string,
  windowEnd: string,
) {
  const byId = new Map(categories.map((category) => [category.id, category]));

  return expenseRows
    .filter((row) => {
      const category = byId.get(row.categoryId);

      if (!category || !isExpenseCategory(category)) {
        return false;
      }

      return categoryHasMonthlyAmountInWindow(
        row.categoryId,
        categories,
        lines,
        windowStart,
        windowEnd,
      );
    })
    .map((row) => ({
      ...row,
      children: (row.children ?? []).filter((child) => {
        if (child.categoryId.endsWith(":direct")) {
          return monthlyAmountInWindow(lines[row.categoryId], windowStart, windowEnd) > 0;
        }

        return categoryHasMonthlyAmountInWindow(
          child.categoryId,
          categories,
          lines,
          windowStart,
          windowEnd,
        );
      }),
    }));
}
