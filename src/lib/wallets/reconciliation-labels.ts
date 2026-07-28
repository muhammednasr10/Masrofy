export const UNKNOWN_INCOME_CATEGORY_NAME = "إيراد غير معروف";
export const UNKNOWN_EXPENSE_CATEGORY_NAME = "مصروف غير معروف";

export function getReconciliationAdjustmentLabel(difference: number, isCredit = false) {
  if (Math.abs(difference) < 0.005) {
    return null;
  }

  const isIncome = isCredit ? difference < 0 : difference > 0;

  return isIncome ? UNKNOWN_INCOME_CATEGORY_NAME : UNKNOWN_EXPENSE_CATEGORY_NAME;
}
