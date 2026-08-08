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
  return getCategoryFullPathLabel(category, categories);
}

export function getCategoryFullPathLabel(
  category: Pick<Category, "id" | "name" | "icon" | "parent_category_id">,
  categories: Category[],
  separator = " › ",
) {
  const byId = new Map(categories.map((item) => [item.id, item]));
  const chain: Array<Pick<Category, "name" | "icon">> = [];
  let current: Pick<Category, "id" | "name" | "icon" | "parent_category_id"> | undefined =
    category;

  while (current) {
    chain.unshift({ name: current.name, icon: current.icon });

    const parentId = getCategoryParentId(current);

    if (!parentId) {
      break;
    }

    current = byId.get(parentId);

    if (chain.length > 50) {
      break;
    }
  }

  return chain.map((item) => `${item.icon} ${item.name}`).join(separator);
}

export function getCategoryDescendantIds(rootId: string, categories: Category[]) {
  const byParent = new Map<string, Category[]>();

  for (const category of normalizeCategories(categories)) {
    const parentId = getCategoryParentId(category);

    if (!parentId) {
      continue;
    }

    const siblings = byParent.get(parentId);

    if (siblings) {
      siblings.push(category);
    } else {
      byParent.set(parentId, [category]);
    }
  }

  const ids = new Set<string>();

  function walk(categoryId: string) {
    for (const child of byParent.get(categoryId) ?? []) {
      ids.add(child.id);
      walk(child.id);
    }
  }

  walk(rootId);
  return ids;
}

export function buildCategoryParentOptions(
  categories: Category[],
  excludeCategoryId?: string | null,
) {
  const excludeIds = new Set<string>();

  if (excludeCategoryId) {
    excludeIds.add(excludeCategoryId);

    for (const id of getCategoryDescendantIds(excludeCategoryId, categories)) {
      excludeIds.add(id);
    }
  }

  return buildCategoryDisplayRows(categories)
    .filter(({ category }) => !excludeIds.has(category.id))
    .map(({ category, depth }) => ({
      category,
      depth,
      label: `${depth > 0 ? `${"—".repeat(depth)} ` : ""}${category.icon} ${category.name}`,
    }));
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
