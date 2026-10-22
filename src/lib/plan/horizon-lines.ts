import {
  emptyHorizonLine,
  isHorizonCadence,
  isHorizonCertainty,
  type HorizonLineDraft,
} from "@/lib/plan/horizon";
import { widestPlannedChildrenRange } from "@/lib/plan/horizon-rollup";
import type { Category, HorizonPlanItem } from "@/lib/types/database";

export function horizonDraftFromItem(
  item: HorizonPlanItem,
): HorizonLineDraft {
  return {
    amount: String(item.planned_amount),
    cadence: isHorizonCadence(item.cadence) ? item.cadence : "monthly",
    certainty: isHorizonCertainty(String(item.certainty ?? "confirmed"))
      ? (item.certainty as HorizonLineDraft["certainty"])
      : "confirmed",
    startDate: String(item.start_date).slice(0, 10),
    endDate: String(item.end_date).slice(0, 10),
    datesManual: false,
  };
}

export function horizonLinesFromItems(
  categories: Category[],
  items: HorizonPlanItem[],
  monthStart: string,
): Record<string, HorizonLineDraft> {
  const lines = Object.fromEntries(
    categories.map((category) => {
      const saved = items.find((item) => item.category_id === category.id);
      return [category.id, saved ? horizonDraftFromItem(saved) : emptyHorizonLine(monthStart)];
    }),
  ) as Record<string, HorizonLineDraft>;

  for (const category of categories) {
    const widest = widestPlannedChildrenRange(category.id, categories, lines);
    const line = lines[category.id];

    if (!widest || !line) {
      continue;
    }

    if (line.startDate !== widest.startDate || line.endDate !== widest.endDate) {
      lines[category.id] = { ...line, datesManual: true };
    }
  }

  return lines;
}
