import type { SupabaseClient } from "@supabase/supabase-js";
import { buildCategoryPayload, type CategoryFormState } from "@/lib/categories/form";
import { getNextCategorySortOrder } from "@/lib/categories/hierarchy";
import type { Category } from "@/lib/types/database";

export async function insertCategory(
  supabase: SupabaseClient,
  userId: string,
  form: CategoryFormState,
  categories: Category[],
): Promise<{ category: Category | null; error: string | null }> {
  const sortOrder = getNextCategorySortOrder(categories, form.parentCategoryId);
  const { data, error } = await supabase
    .from("categories")
    .insert(buildCategoryPayload(form, userId, sortOrder))
    .select("*")
    .single();

  if (error) {
    return { category: null, error: error.message };
  }

  return { category: data as Category, error: null };
}
