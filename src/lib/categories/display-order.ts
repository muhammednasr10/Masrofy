import {
  UNKNOWN_EXPENSE_CATEGORY_NAME,
  UNKNOWN_INCOME_CATEGORY_NAME,
} from "@/lib/wallets/reconciliation-labels";

export const OTHER_CATEGORY_NAME = "أخرى";

const TRAILING_CATEGORY_RANK: Record<string, number> = {
  [UNKNOWN_INCOME_CATEGORY_NAME]: 1,
  [UNKNOWN_EXPENSE_CATEGORY_NAME]: 2,
  [OTHER_CATEGORY_NAME]: 3,
};

export function getTrailingCategoryRank(name: string) {
  return TRAILING_CATEGORY_RANK[name] ?? 0;
}

export function isTrailingCategoryName(name: string) {
  return getTrailingCategoryRank(name) > 0;
}

/** Normal categories first, then إيراد غير معروف → مصروف غير معروف → أخرى. */
export function compareCategoriesForDisplay(
  left: { name: string; sort_order?: number },
  right: { name: string; sort_order?: number },
) {
  const leftRank = getTrailingCategoryRank(left.name);
  const rightRank = getTrailingCategoryRank(right.name);
  const leftTrailing = leftRank > 0 ? 1 : 0;
  const rightTrailing = rightRank > 0 ? 1 : 0;

  if (leftTrailing !== rightTrailing) {
    return leftTrailing - rightTrailing;
  }

  if (leftTrailing && rightTrailing) {
    return leftRank - rightRank;
  }

  const leftOrder = left.sort_order ?? 0;
  const rightOrder = right.sort_order ?? 0;

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }

  return left.name.localeCompare(right.name, "ar");
}

/** Keep trailing names last while preserving another primary sort (e.g. amount). */
export function compareWithTrailingNamesLast(
  leftName: string,
  rightName: string,
  primaryCompare: number,
) {
  const leftRank = getTrailingCategoryRank(leftName);
  const rightRank = getTrailingCategoryRank(rightName);
  const leftTrailing = leftRank > 0 ? 1 : 0;
  const rightTrailing = rightRank > 0 ? 1 : 0;

  if (leftTrailing !== rightTrailing) {
    return leftTrailing - rightTrailing;
  }

  if (leftTrailing && rightTrailing) {
    return leftRank - rightRank;
  }

  return primaryCompare;
}
