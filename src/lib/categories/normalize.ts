import type { Category } from "@/lib/types/database";

export function normalizeCategory(category: Category): Category {
  return {
    ...category,
    parent_category_id: category.parent_category_id ?? null,
    sort_order: category.sort_order ?? 0,
  };
}

export function normalizeCategories(categories: Category[]) {
  return categories.map(normalizeCategory);
}

export function getCategoryParentId(category: Pick<Category, "parent_category_id">) {
  return category.parent_category_id ?? null;
}

export function sortCategories(categories: Category[]) {
  return [...categories].sort((a, b) => a.sort_order - b.sort_order);
}
