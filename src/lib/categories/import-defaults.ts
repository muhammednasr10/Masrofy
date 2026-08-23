import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, DefaultCategory } from "@/lib/types/database";

export type ImportDefaultCategoriesResult = {
  inserted: number;
  synced: number;
};

export function findMatchingDefaultCategory(
  catalog: DefaultCategory[],
  name: string,
  parentCategoryId: string | null,
  categories: Category[],
): DefaultCategory | null {
  const trimmedName = name.trim();
  const parentName = parentCategoryId
    ? (categories.find((category) => category.id === parentCategoryId)?.name ?? null)
    : null;

  return (
    catalog.find(
      (item) =>
        item.is_active &&
        item.name === trimmedName &&
        (item.parent_name ?? null) === (parentName ?? null),
    ) ?? null
  );
}

export async function loadActiveDefaultCategories(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("default_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return { catalog: [] as DefaultCategory[], error: error.message };
  }

  return { catalog: (data ?? []) as DefaultCategory[], error: null };
}

export async function importDefaultCategories(
  supabase: SupabaseClient,
): Promise<{ result: ImportDefaultCategoriesResult | null; error: string | null }> {
  const { data, error } = await supabase.rpc("import_default_categories");

  if (error) {
    return { result: null, error: error.message };
  }

  const payload = data as Partial<ImportDefaultCategoriesResult> | null;

  return {
    result: {
      inserted: payload?.inserted ?? 0,
      synced: payload?.synced ?? 0,
    },
    error: null,
  };
}
