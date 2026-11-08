export const UNKNOWN_INCOME_CATEGORY_NAME = "إيراد غير معروف";
export const UNKNOWN_EXPENSE_CATEGORY_NAME = "مصروف غير معروف";

export type BalanceDifferenceKind = "income" | "expense";

export function getBalanceDifferenceKind(difference: number, isCredit = false): BalanceDifferenceKind | null {
  if (Math.abs(difference) < 0.005) {
    return null;
  }

  const isIncome = isCredit ? difference < 0 : difference > 0;
  return isIncome ? "income" : "expense";
}

export function getReconciliationAdjustmentLabel(difference: number, isCredit = false) {
  const kind = getBalanceDifferenceKind(difference, isCredit);

  if (!kind) {
    return null;
  }

  return kind === "income" ? UNKNOWN_INCOME_CATEGORY_NAME : UNKNOWN_EXPENSE_CATEGORY_NAME;
}
