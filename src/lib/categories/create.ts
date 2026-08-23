import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildCategoryPayload,
  buildCategoryUpdatePayload,
  type CategoryFormState,
} from "@/lib/categories/form";
import { getNextCategorySortOrder } from "@/lib/categories/hierarchy";
import {
  findMatchingDefaultCategory,
  loadActiveDefaultCategories,
} from "@/lib/categories/import-defaults";
import type { Category } from "@/lib/types/database";

export async function insertCategory(
  supabase: SupabaseClient,
  userId: string,
  form: CategoryFormState,
  categories: Category[],
): Promise<{ category: Category | null; error: string | null }> {
  let resolvedForm = form;
  const { catalog } = await loadActiveDefaultCategories(supabase);
  const defaultMatch = findMatchingDefaultCategory(
    catalog,
    form.name,
    form.parentCategoryId,
    categories,
  );

  if (defaultMatch) {
    resolvedForm = {
      ...form,
      name: defaultMatch.name,
      icon: defaultMatch.icon,
      color: defaultMatch.color,
    };

    const existing = categories.find(
      (category) =>
        category.name === defaultMatch.name &&
        (category.parent_category_id ?? null) === (resolvedForm.parentCategoryId ?? null),
    );

    if (existing) {
      const { data, error } = await supabase
        .from("categories")
        .update({
          icon: defaultMatch.icon,
          color: defaultMatch.color,
        })
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) {
        return { category: null, error: error.message };
      }

      return { category: data as Category, error: null };
    }
  }

  const sortOrder = getNextCategorySortOrder(categories, resolvedForm.parentCategoryId);
  const { data, error } = await supabase
    .from("categories")
    .insert(buildCategoryPayload(resolvedForm, userId, sortOrder))
    .select("*")
    .single();

  if (error) {
    return { category: null, error: error.message };
  }

  if (!defaultMatch) {
    notifyAdminOfCategory(data.id);
  }

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
