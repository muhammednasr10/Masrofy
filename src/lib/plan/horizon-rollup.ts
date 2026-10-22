import { getDirectChildCategories } from "@/lib/categories/hierarchy";
import { isDateKey, type HorizonLineDraft } from "@/lib/plan/horizon";
import type { Category } from "@/lib/types/database";

export function getPlannedDirectChildren(
  parentId: string,
  categories: Category[],
  lines: Record<string, HorizonLineDraft>,
) {
  return getDirectChildCategories(parentId, categories).filter(
    (category) => Number(lines[category.id]?.amount || 0) > 0,
  );
}

export function hasPlannedDirectChildren(
  parentId: string,
  categories: Category[],
  lines: Record<string, HorizonLineDraft>,
) {
  return getPlannedDirectChildren(parentId, categories, lines).length > 0;
}

/** Parents with planned children are display rollups — children count in totals. */
export function isHorizonRollupParent(
  categoryId: string,
  categories: Category[],
  lines: Record<string, HorizonLineDraft>,
) {
  return hasPlannedDirectChildren(categoryId, categories, lines);
}

export function sumPlannedChildrenAmounts(
  parentId: string,
  categories: Category[],
  lines: Record<string, HorizonLineDraft>,
) {
  return getPlannedDirectChildren(parentId, categories, lines).reduce(
    (total, category) => total + Number(lines[category.id]?.amount || 0),
    0,
  );
}

export function widestPlannedChildrenRange(
  parentId: string,
  categories: Category[],
  lines: Record<string, HorizonLineDraft>,
): { startDate: string; endDate: string } | null {
  const children = getPlannedDirectChildren(parentId, categories, lines);
  let startDate: string | null = null;
  let endDate: string | null = null;

  for (const category of children) {
    const line = lines[category.id];

    if (!line || !isDateKey(line.startDate) || !isDateKey(line.endDate) || line.endDate < line.startDate) {
      continue;
    }

    if (!startDate || line.startDate < startDate) {
      startDate = line.startDate;
    }

    if (!endDate || line.endDate > endDate) {
      endDate = line.endDate;
    }
  }

  if (!startDate || !endDate) {
    return null;
  }

  return { startDate, endDate };
}

export function buildRollupParentPatch(
  parentId: string,
  categories: Category[],
  lines: Record<string, HorizonLineDraft>,
): Partial<HorizonLineDraft> | null {
  if (!hasPlannedDirectChildren(parentId, categories, lines)) {
    return null;
  }

  const line = lines[parentId];
  const sum = sumPlannedChildrenAmounts(parentId, categories, lines);
  const widest = widestPlannedChildrenRange(parentId, categories, lines);
  const patch: Partial<HorizonLineDraft> = {};
  const sumText = sum > 0 ? String(sum) : "";

  if ((line?.amount || "") !== sumText) {
    patch.amount = sumText;
  }

  if (widest && !line?.datesManual) {
    if (line?.startDate !== widest.startDate) {
      patch.startDate = widest.startDate;
    }

    if (line?.endDate !== widest.endDate) {
      patch.endDate = widest.endDate;
    }
  }

  return Object.keys(patch).length > 0 ? patch : null;
}
