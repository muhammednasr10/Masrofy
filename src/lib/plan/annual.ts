import type {
  AnnualPlanTemplateItem,
  Category,
} from "@/lib/types/database";
import { getMonthRange } from "@/lib/utils/format";
import { parsePlanMonthKey } from "@/lib/plan/summary";

export function getPlanYear(planMonthKey: string) {
  return parsePlanMonthKey(planMonthKey).getFullYear();
}

export function getYearMonthKeys(year: number) {
  return Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, "0");
    return `${year}-${month}`;
  });
}

export function categoryPlansFromTemplateItems(
  categories: Category[],
  templateItems: AnnualPlanTemplateItem[],
) {
  const plannedByCategory = new Map<string, number>();

  for (const item of templateItems) {
    plannedByCategory.set(item.category_id, Number(item.planned_amount));
  }

  return Object.fromEntries(
    categories.map((category) => [
      category.id,
      plannedByCategory.has(category.id) ? String(plannedByCategory.get(category.id)) : "",
    ]),
  ) as Record<string, string>;
}

export function getMonthStartFromPlanMonthKey(planMonthKey: string) {
  return getMonthRange(parsePlanMonthKey(planMonthKey)).start;
}

export function buildAnnualTemplateFormState(
  categories: Category[],
  templateItems: AnnualPlanTemplateItem[],
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
