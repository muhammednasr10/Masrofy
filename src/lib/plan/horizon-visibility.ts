import { getCategoryDescendantIds } from "@/lib/categories/hierarchy";
import { isExpenseCategory } from "@/lib/categories/flow";
import type { HorizonLineDraft } from "@/lib/plan/horizon";
import type { Category, PlanComparisonRow } from "@/lib/types/database";

export function categoryHasHorizonAmount(
  categoryId: string,
  categories: Category[],
  lines: Record<string, HorizonLineDraft>,
) {
  const ids = [categoryId, ...getCategoryDescendantIds(categoryId, categories)];
  return ids.some((id) => Number(lines[id]?.amount || 0) > 0);
}

export function filterMonthComparisonExpenseRows(
  expenseRows: PlanComparisonRow[],
  categories: Category[],
  lines: Record<string, HorizonLineDraft>,
) {
  const byId = new Map(categories.map((category) => [category.id, category]));

  return expenseRows
    .filter((row) => {
      const category = byId.get(row.categoryId);

      if (!category || !isExpenseCategory(category)) {
        return false;
      }

      return categoryHasHorizonAmount(row.categoryId, categories, lines);
    })
    .map((row) => ({
      ...row,
      children: (row.children ?? []).filter((child) => {
        if (child.categoryId.endsWith(":direct")) {
          return Number(lines[row.categoryId]?.amount || 0) > 0;
        }

        return categoryHasHorizonAmount(child.categoryId, categories, lines);
      }),
    }));
}
