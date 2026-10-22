import { describe, expect, it } from "vitest";
import {
  buildRollupParentPatch,
  isHorizonRollupParent,
  sumPlannedChildrenAmounts,
  widestPlannedChildrenRange,
} from "@/lib/plan/horizon-rollup";
import type { Category } from "@/lib/types/database";
import type { HorizonLineDraft } from "@/lib/plan/horizon";

const parent: Category = {
  id: "installments",
  user_id: "u",
  name: "أقساط",
  icon: "📅",
  color: "#000",
  parent_category_id: null,
  flow: "expense",
  sort_order: 1,
  created_at: "",
};

const childA: Category = {
  ...parent,
  id: "loan",
  name: "قسط السلفة",
  parent_category_id: "installments",
  sort_order: 1,
};

const childB: Category = {
  ...parent,
  id: "credit",
  name: "قسط الكريديت",
  parent_category_id: "installments",
  sort_order: 2,
};

const lines: Record<string, HorizonLineDraft> = {
  installments: {
    amount: "0",
    cadence: "monthly",
    certainty: "confirmed",
    startDate: "2026-10-01",
    endDate: "2027-09-30",
    datesManual: false,
  },
  loan: {
    amount: "750",
    cadence: "monthly",
    certainty: "confirmed",
    startDate: "2026-10-01",
    endDate: "2026-11-30",
  },
  credit: {
    amount: "750",
    cadence: "monthly",
    certainty: "confirmed",
    startDate: "2026-10-15",
    endDate: "2027-04-30",
  },
};

describe("horizon parent rollup", () => {
  it("treats parents with planned children as rollups", () => {
    expect(isHorizonRollupParent("installments", [parent, childA, childB], lines)).toBe(true);
    expect(isHorizonRollupParent("loan", [parent, childA, childB], lines)).toBe(false);
  });

  it("sums children amounts and takes the widest date range", () => {
    expect(sumPlannedChildrenAmounts("installments", [parent, childA, childB], lines)).toBe(1500);
    expect(widestPlannedChildrenRange("installments", [parent, childA, childB], lines)).toEqual({
      startDate: "2026-10-01",
      endDate: "2027-04-30",
    });
  });

  it("builds a sync patch unless dates were edited manually", () => {
    expect(buildRollupParentPatch("installments", [parent, childA, childB], lines)).toEqual({
      amount: "1500",
      endDate: "2027-04-30",
    });

    const manualLines = {
      ...lines,
      installments: { ...lines.installments, datesManual: true, amount: "1500" },
    };

    expect(buildRollupParentPatch("installments", [parent, childA, childB], manualLines)).toBeNull();
  });
});
