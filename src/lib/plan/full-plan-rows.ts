import { compareWithTrailingNamesLast } from "@/lib/categories/display-order";
import { buildCategoryDisplayRows } from "@/lib/categories/hierarchy";
import { getCategoryParentId } from "@/lib/categories/normalize";
import { isIncomeCategory } from "@/lib/categories/flow";
import {
  isConfirmedHorizonLine,
  isDateKey,
  type HorizonLineDraft,
} from "@/lib/plan/horizon";
import { isHorizonRollupParent } from "@/lib/plan/horizon-rollup";
import type { Category } from "@/lib/types/database";

export type PlanKindTab = "income" | "expense";

export function lineDatesReady(line: HorizonLineDraft) {
  return isDateKey(line.startDate) && isDateKey(line.endDate) && line.endDate >= line.startDate;
}

export function isCategoryRowVisible(
  category: Category,
  categoriesById: Map<string, Category>,
  expandedParentIds: Set<string>,
) {
  let parentId = getCategoryParentId(category);

  while (parentId) {
    if (!expandedParentIds.has(parentId)) {
      return false;
    }

    const parent = categoriesById.get(parentId);
    parentId = parent ? getCategoryParentId(parent) : null;
  }

  return true;
}

export function matchesPlanKind(category: Category, kind: PlanKindTab) {
  const isIncome = isIncomeCategory(category);
  return kind === "income" ? isIncome : !isIncome;
}

function lineAmount(lines: Record<string, HorizonLineDraft>, categoryId: string) {
  return Number(lines[categoryId]?.amount || 0);
}

/** Keep hierarchy, but sort each sibling group by amount (largest first). */
export function sortPlanRowsByAmount(
  rows: Array<{ category: Category; depth: number }>,
  lines: Record<string, HorizonLineDraft>,
) {
  const byParent = new Map<string | null, Category[]>();

  for (const { category } of rows) {
    const parentId = getCategoryParentId(category);
    const siblings = byParent.get(parentId) ?? [];
    siblings.push(category);
    byParent.set(parentId, siblings);
  }

  for (const siblings of byParent.values()) {
    siblings.sort((left, right) =>
      compareWithTrailingNamesLast(
        left.name,
        right.name,
        lineAmount(lines, right.id) - lineAmount(lines, left.id) ||
          left.sort_order - right.sort_order ||
          left.name.localeCompare(right.name, "ar"),
      ),
    );
  }

  const sorted: Array<{ category: Category; depth: number }> = [];

  function walk(parentId: string | null, depth: number) {
    for (const category of byParent.get(parentId) ?? []) {
      sorted.push({ category, depth });
      walk(category.id, depth + 1);
    }
  }

  walk(null, 0);
  return sorted;
}

export function buildScopedPlanRows(
  categories: Category[],
  lines: Record<string, HorizonLineDraft>,
  planKind: PlanKindTab,
) {
  const scopedCategories = categories.filter((category) => matchesPlanKind(category, planKind));
  const rows = sortPlanRowsByAmount(buildCategoryDisplayRows(scopedCategories), lines);
  return { scopedCategories, rows };
}

export function collectConfirmedScopedLines(
  rows: Array<{ category: Category }>,
  scopedCategories: Category[],
  lines: Record<string, HorizonLineDraft>,
) {
  return rows.flatMap(({ category }) => {
    const line = lines[category.id];

    if (
      !line ||
      !lineDatesReady(line) ||
      !isConfirmedHorizonLine(line) ||
      isHorizonRollupParent(category.id, scopedCategories, lines)
    ) {
      return [];
    }

    return [
      {
        amount: Number(line.amount || 0),
        cadence: line.cadence,
        startDate: line.startDate,
        endDate: line.endDate,
      },
    ];
  });
}
