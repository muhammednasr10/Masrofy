import type { Category, CategoryFlow } from "@/lib/types/database";
import { UNKNOWN_INCOME_CATEGORY_NAME } from "@/lib/wallets/reconciliation-labels";

export const CATEGORY_FLOWS = ["income", "expense"] as const;

export type { CategoryFlow };

export function isCategoryFlow(value: unknown): value is CategoryFlow {
  return value === "income" || value === "expense";
}

/** Legacy rows / offline payloads may omit flow — infer from name. */
export function getCategoryFlow(
  category: Pick<Category, "name"> & { flow?: CategoryFlow | null },
): CategoryFlow {
  if (isCategoryFlow(category.flow)) {
    return category.flow;
  }

  if (
    category.name === UNKNOWN_INCOME_CATEGORY_NAME ||
    category.name.startsWith("إيراد")
  ) {
    return "income";
  }

  return "expense";
}

export function isIncomeCategory(
  category: Pick<Category, "name"> & { flow?: CategoryFlow | null },
) {
  return getCategoryFlow(category) === "income";
}

export function isExpenseCategory(
  category: Pick<Category, "name"> & { flow?: CategoryFlow | null },
) {
  return getCategoryFlow(category) === "expense";
}
