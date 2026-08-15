import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildCategoryPayload,
  buildCategoryUpdatePayload,
  type CategoryFormState,
} from "@/lib/categories/form";
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

  notifyAdminOfCategory(data.id);
  return { category: data as Category, error: null };
}

function notifyAdminOfCategory(categoryId: string) {
  void fetch("/api/admin/notify-category-suggestion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categoryId }),
  }).catch(() => {
    // Notification is best-effort.
  });
}

export async function updateCategory(
  supabase: SupabaseClient,
  form: CategoryFormState,
): Promise<{ category: Category | null; error: string | null }> {
  if (!form.editingCategoryId) {
    return { category: null, error: "missing_category_id" };
  }

  const { data, error } = await supabase
    .from("categories")
    .update(buildCategoryUpdatePayload(form))
    .eq("id", form.editingCategoryId)
    .select("*")
    .single();

  if (error) {
    return { category: null, error: error.message };
  }

  return { category: data as Category, error: null };
}
