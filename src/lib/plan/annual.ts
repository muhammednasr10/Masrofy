import { rollCategoryPlansToParents } from "@/lib/plan/summary";
import type { Category } from "@/lib/types/database";

export function categoryPlansFromTemplateItems(
  categories: Category[],
  templateItems: Array<{ category_id: string; planned_amount: number }>,
) {
  const plannedByCategory = new Map<string, number>();

  for (const item of templateItems) {
    plannedByCategory.set(item.category_id, Number(item.planned_amount));
  }

  return rollCategoryPlansToParents(categories, plannedByCategory);
}

export function buildAnnualTemplateFormState(
  categories: Category[],
  templateItems: Array<{ category_id: string; planned_amount: number }>,
) {
  return categoryPlansFromTemplateItems(categories, templateItems);
}

export function buildAnnualTemplatePayloadItems(
  categories: Category[],
  categoryPlans: Record<string, string>,
  userId: string,
  templateId: string,
) {
  return categories
    .map((category, index) => ({
      user_id: userId,
      template_id: templateId,
      category_id: category.id,
      planned_amount: Number(categoryPlans[category.id] || 0),
      sort_order: index + 1,
    }))
    .filter((item) => item.planned_amount > 0);
}

export function buildMonthlyPlanPayloadItems(
  categories: Category[],
  categoryPlans: Record<string, string>,
  userId: string,
  planId: string,
) {
  return categories
    .map((category, index) => ({
      user_id: userId,
      plan_id: planId,
      category_id: category.id,
      planned_amount: Number(categoryPlans[category.id] || 0),
      sort_order: index + 1,
    }))
    .filter((item) => item.planned_amount > 0);
}
