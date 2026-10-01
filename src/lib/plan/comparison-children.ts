import {
  getCategoryDescendantIds,
  getDirectChildCategories,
} from "@/lib/categories/hierarchy";
import type { Category, PlanComparisonChildRow } from "@/lib/types/database";

function sumCategoryAmounts(categoryIds: string[], amounts: Map<string, number>) {
  return categoryIds.reduce((total, categoryId) => total + (amounts.get(categoryId) ?? 0), 0);
}

export function buildComparisonChildren(
  parent: Category,
  categories: Category[],
  plannedByCategory: Map<string, number>,
  actualByCategory: Map<string, number>,
): PlanComparisonChildRow[] {
  const children = getDirectChildCategories(parent.id, categories)
    .map((category) => {
      const categoryIds = [category.id, ...getCategoryDescendantIds(category.id, categories)];

      return {
        categoryId: category.id,
        name: category.name,
        icon: category.icon,
        planned: sumCategoryAmounts(categoryIds, plannedByCategory),
        actual: sumCategoryAmounts(categoryIds, actualByCategory),
      };
    })
    .filter((row) => row.planned > 0 || row.actual > 0)
    .sort((left, right) => right.actual - left.actual || right.planned - left.planned);

  const directActual = actualByCategory.get(parent.id) ?? 0;

  if (directActual > 0 && children.length > 0) {
    children.unshift({
      categoryId: `${parent.id}:direct`,
      name: "على الفئة نفسها",
      icon: parent.icon,
      planned: 0,
      actual: directActual,
    });
  }

  return children;
}
