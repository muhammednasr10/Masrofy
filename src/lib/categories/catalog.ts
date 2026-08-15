import type { DefaultCategory } from "@/lib/types/database";
import { ONBOARDING_CATEGORY_PRESETS } from "@/lib/onboarding/presets";

export function fallbackDefaultCategories(): Array<
  Pick<DefaultCategory, "name" | "icon" | "color" | "parent_name" | "sort_order">
> {
  return ONBOARDING_CATEGORY_PRESETS.map((category, index) => ({
    ...category,
    parent_name: null,
    sort_order: index + 1,
  }));
}

export function rootCatalogCategories<T extends { parent_name?: string | null }>(categories: T[]) {
  return categories.filter((category) => !category.parent_name);
}

export function childCatalogCategories<T extends { parent_name?: string | null; name: string }>(
  categories: T[],
  parentName: string,
) {
  return categories.filter((category) => category.parent_name === parentName);
}
