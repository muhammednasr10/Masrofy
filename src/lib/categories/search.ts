import {
  buildCategoryDisplayRows,
  getCategoryFullPathLabel,
} from "@/lib/categories/hierarchy";
import type { Category } from "@/lib/types/database";

export type CategorySearchItem = {
  id: string;
  category: Category;
  depth: number;
  pathLabel: string;
  searchText: string;
  hasChildren: boolean;
};

export function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase("ar");
}

export function buildCategorySearchIndex(categories: Category[]): CategorySearchItem[] {
  const rows = buildCategoryDisplayRows(categories);
  const childCounts = new Map<string, number>();

  for (const category of categories) {
    const parentId = category.parent_category_id;

    if (parentId) {
      childCounts.set(parentId, (childCounts.get(parentId) ?? 0) + 1);
    }
  }

  return rows.map(({ category, depth }) => {
    const pathLabel = getCategoryFullPathLabel(category, categories);
    const pathNames = pathLabel
      .split("›")
      .map((part) => part.replace(/[^\p{L}\p{N}\s]/gu, "").trim())
      .filter(Boolean);

    const searchText = normalizeSearchText(
      [category.name, ...pathNames, pathLabel.replace(/[^\p{L}\p{N}\s]/gu, " ")].join(" "),
    );

    return {
      id: category.id,
      category,
      depth,
      pathLabel,
      searchText,
      hasChildren: (childCounts.get(category.id) ?? 0) > 0,
    };
  });
}

export function searchCategoryItems(
  query: string,
  items: CategorySearchItem[],
): CategorySearchItem[] {
  const normalized = normalizeSearchText(query);

  if (!normalized) {
    return items;
  }

  const words = normalized.split(/\s+/).filter(Boolean);

  return items
    .map((item) => {
      let score = 0;
      const name = normalizeSearchText(item.category.name);

      if (name === normalized) {
        score += 100;
      } else if (name.startsWith(normalized)) {
        score += 50;
      } else if (name.includes(normalized)) {
        score += 30;
      }

      if (item.searchText.includes(normalized)) {
        score += 20;
      }

      for (const word of words) {
        if (name.includes(word)) {
          score += 10;
        }

        if (item.searchText.includes(word)) {
          score += 5;
        }
      }

      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.item.depth - b.item.depth ||
        a.item.category.name.localeCompare(b.item.category.name, "ar"),
    )
    .map(({ item }) => item);
}
