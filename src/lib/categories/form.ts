import type { Category, CategoryFlow } from "@/lib/types/database";
import {
  defaultCategoryColor,
  defaultCategoryIcon,
} from "@/lib/constants/category-options";
import { getCategoryFlow } from "@/lib/categories/flow";

export type CategoryFormState = {
  editingCategoryId: string | null;
  name: string;
  icon: string;
  color: string;
  parentCategoryId: string | null;
  flow: CategoryFlow;
};

export function emptyCategoryForm(
  parentCategoryId: string | null = null,
  flow: CategoryFlow = "expense",
): CategoryFormState {
  return {
    editingCategoryId: null,
    name: "",
    icon: defaultCategoryIcon,
    color: defaultCategoryColor,
    parentCategoryId,
    flow,
  };
}

export function categoryToFormState(category: Category): CategoryFormState {
  return {
    editingCategoryId: category.id,
    name: category.name,
    icon: category.icon,
    color: category.color,
    parentCategoryId: category.parent_category_id,
    flow: getCategoryFlow(category),
  };
}

export function buildCategoryUpdatePayload(form: CategoryFormState) {
  return {
    name: form.name.trim(),
    icon: form.icon,
    color: form.color,
    parent_category_id: form.parentCategoryId,
    flow: form.flow,
  };
}

export function buildCategoryPayload(
  form: CategoryFormState,
  userId: string,
  sortOrder: number,
) {
  return {
    user_id: userId,
    name: form.name.trim(),
    icon: form.icon,
    color: form.color,
    parent_category_id: form.parentCategoryId,
    flow: form.flow,
    sort_order: sortOrder,
  };
}
