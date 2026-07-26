import type { Category } from "@/lib/types/database";
import {
  getCategoryParentId,
  normalizeCategories,
} from "@/lib/categories/normalize";

export function isSubCategory(category: Pick<Category, "parent_category_id">): boolean {
  return getCategoryParentId(category) !== null;
}

export function buildCategoryDisplayRows(categories: Category[]) {
  const byParent = new Map<string | null, Category[]>();

  for (const category of normalizeCategories(categories)) {
    const key = getCategoryParentId(category);
    const siblings = byParent.get(key);

    if (siblings) {
      siblings.push(category);
    } else {
      byParent.set(key, [category]);
    }
  }

  for (const siblings of byParent.values()) {
    siblings.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ar"));
  }

  const rows: Array<{ category: Category; depth: number }> = [];

  function walk(parentId: string | null, depth: number) {
    for (const category of byParent.get(parentId) ?? []) {
      rows.push({ category, depth });
      walk(category.id, depth + 1);
    }
  }

  walk(null, 0);
  return rows;
}

export function getParentCategories(categories: Category[]) {
  return normalizeCategories(categories).filter(
    (category) => getCategoryParentId(category) === null,
  );
}

export function categoryHasChildren(categoryId: string, categories: Category[]) {
  return normalizeCategories(categories).some(
    (category) => getCategoryParentId(category) === categoryId,
  );
}

export function getDirectChildCategories(parentId: string, categories: Category[]) {
  return normalizeCategories(categories).filter(
    (category) => getCategoryParentId(category) === parentId,
  );
}

export type CategorySelectGroup = {
  parent: Category;
  children: Category[];
};

export function buildCategorySelectGroups(categories: Category[]): CategorySelectGroup[] {
  return getParentCategories(categories).map((parent) => ({
    parent,
    children: getDirectChildCategories(parent.id, categories),
  }));
}

export function getCategorySelectGroupLabel(category: Category) {
  return `${category.icon} ${category.name}`;
}

export function getCategorySelectOptionLabel(
  category: Category,
  role: "standalone" | "parent" | "child" = "standalone",
) {
  const base = `${category.icon} ${category.name}`;

  if (role === "parent") {
    return `${base} — رئيسية`;
  }

  if (role === "child") {
    return `↳ ${base}`;
  }

  return base;
}

export function getCategoryPathLabel(
  category: Pick<Category, "id" | "name" | "icon" | "parent_category_id">,
  categories: Category[],
) {
  const parentId = getCategoryParentId(category);

  if (!parentId) {
    return `${category.icon} ${category.name}`;
  }

  const parent = categories.find((item) => item.id === parentId);

  if (!parent) {
    return `${category.icon} ${category.name}`;
  }

  return `${parent.icon} ${parent.name} › ${category.icon} ${category.name}`;
}

export function getNextCategorySortOrder(
  categories: Category[],
  parentCategoryId: string | null,
) {
  const siblings = parentCategoryId
    ? getDirectChildCategories(parentCategoryId, categories)
    : getParentCategories(categories);

  if (siblings.length === 0) {
    return 1;
  }

  return Math.max(...siblings.map((category) => category.sort_order)) + 1;
}
