export const CATEGORY_BUDGET_WARNING_RATIO = 0.8;

export function getCategoryBudgetTone(planned: number, actual: number) {
  const overBudget = planned > 0 && actual > planned;
  const nearBudget =
    planned > 0 && !overBudget && actual / planned >= CATEGORY_BUDGET_WARNING_RATIO;
  const underBudget = planned > 0 && actual < planned;

  return { overBudget, nearBudget, underBudget };
}
