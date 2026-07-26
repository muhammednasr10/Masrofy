import type { Category } from "@/lib/types/database";
import {
  defaultCategoryColor,
  defaultCategoryIcon,
} from "@/lib/constants/category-options";

export type CategoryFormState = {
  name: string;
  icon: string;
  color: string;
  parentCategoryId: string | null;
};

export function emptyCategoryForm(parentCategoryId: string | null = null): CategoryFormState {
  return {
    name: "",
    icon: defaultCategoryIcon,
    color: defaultCategoryColor,
    parentCategoryId,
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
    sort_order: sortOrder,
  };
}
