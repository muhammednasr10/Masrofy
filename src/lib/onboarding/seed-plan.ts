import { ONBOARDING_PLAN_CATEGORY_RATIOS } from "@/lib/onboarding/presets";

type CategoryRow = {
  id: string;
  name: string;
};

export function buildDefaultPlanItems(
  userId: string,
  planId: string,
  categories: CategoryRow[],
  plannedIncome: number,
) {
  return categories
    .map((category, index) => {
      const ratio = ONBOARDING_PLAN_CATEGORY_RATIOS[category.name];

      if (!ratio) {
        return null;
      }

      return {
        user_id: userId,
        plan_id: planId,
        category_id: category.id,
        planned_amount: Math.round(plannedIncome * ratio),
        sort_order: index,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item != null && item.planned_amount > 0);
}
