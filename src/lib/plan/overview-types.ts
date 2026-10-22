import { defaultHorizonEndDate, isDateKey, type HorizonCadence, type HorizonLineDraft } from "@/lib/plan/horizon";
import { isIncomeCategory } from "@/lib/categories/flow";
import type { Category } from "@/lib/types/database";

export const OVERVIEW_VIEWS = ["daily", "weekly", "monthly", "yearly"] as const;

export type OverviewView = (typeof OVERVIEW_VIEWS)[number];

export type OverviewPeriod = {
  start: string;
  end: string;
  label: string;
};

export type OverviewPeriodRow = OverviewPeriod & {
  income: number;
  expense: number;
  difference: number;
  cumulativeDifference: number;
  isCurrentPeriod?: boolean;
  plannedIncome?: number;
  plannedExpense?: number;
  plannedDifference?: number;
};

export type PlanOverviewSource = {
  categories: Category[];
  lines: Record<string, HorizonLineDraft>;
  plannedMonthlyIncome: number;
  currentMonthStart: string;
  actualMonthIncome: number;
  actualMonthExpense: number;
};

export const OVERVIEW_VIEW_LABELS: Record<OverviewView, string> = {
  daily: "يومي",
  weekly: "أسبوعي",
  monthly: "شهري",
  yearly: "سنوي",
};

const TO_MONTHLY: Record<HorizonCadence, number> = {
  daily: 365 / 12,
  weekly: 52 / 12,
  monthly: 1,
  yearly: 1 / 12,
};

export function convertCadenceAmount(
  amount: number,
  from: HorizonCadence,
  to: OverviewView,
) {
  if (!Number.isFinite(amount) || amount === 0) {
    return 0;
  }

  const monthly = amount * TO_MONTHLY[from];
  return monthly / TO_MONTHLY[to];
}

export function isPlanIncomeCategory(
  category: Pick<Category, "name"> & { flow?: Category["flow"] | null },
) {
  return isIncomeCategory(category);
}

export function defaultOverviewRangeEnd(rangeStart: string) {
  return defaultHorizonEndDate(rangeStart);
}

export function isOverviewRangeReady(rangeStart: string, rangeEnd: string) {
  return isDateKey(rangeStart) && isDateKey(rangeEnd) && rangeEnd >= rangeStart;
}

export function periodColumnLabel(view: OverviewView) {
  if (view === "daily") {
    return "اليوم";
  }

  if (view === "weekly") {
    return "الأسبوع";
  }

  if (view === "yearly") {
    return "السنة";
  }

  return "الشهر";
}
