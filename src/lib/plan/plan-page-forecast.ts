import { getMonthRange, parsePlanMonthKey } from "@/lib/calendar";
import {
  horizonOverlapsRange,
  isHorizonCadence,
  sumHorizonExpenses,
} from "@/lib/plan/horizon";
import { horizonDraftFromItem } from "@/lib/plan/horizon-lines";
import { isHorizonRollupParent } from "@/lib/plan/horizon-rollup";
import { buildPlanWealthForecast, sumAnnualPlannedExpenses } from "@/lib/plan/wealth-forecast";
import type {
  AnnualPlanTemplate,
  AnnualPlanTemplateItem,
  Category,
  HorizonPlanItem,
  Investment,
  PlanComparison,
  Transaction,
  Wallet,
} from "@/lib/types/database";

export function buildPlanPageWealthForecast({
  categories,
  comparison,
  horizonItems,
  annualTemplate,
  annualTemplateItems,
  wallets,
  transactionsBeforeMonth,
  investments,
  monthStart,
  monthStartDay,
  planMonthKey,
  planYear,
}: {
  categories: Category[];
  comparison: PlanComparison;
  horizonItems: HorizonPlanItem[];
  annualTemplate: AnnualPlanTemplate | null;
  annualTemplateItems: AnnualPlanTemplateItem[];
  wallets: Wallet[];
  transactionsBeforeMonth: Transaction[];
  investments: Investment[];
  monthStart: string;
  monthStartDay: number;
  planMonthKey: string;
  planYear: number;
}) {
  const yearEnd = getMonthRange(
    parsePlanMonthKey(`${planYear}-12`, monthStartDay),
    "en",
    monthStartDay,
  ).end;
  const horizonLinesFromItems = Object.fromEntries(
    horizonItems.map((item) => [item.category_id, horizonDraftFromItem(item)]),
  );
  const savedHorizonLines = horizonItems
    .filter(
      (item) =>
        Number(item.planned_amount) > 0 &&
        (item.certainty == null || item.certainty === "confirmed") &&
        !isHorizonRollupParent(item.category_id, categories, horizonLinesFromItems),
    )
    .map((item) => ({
      amount: Number(item.planned_amount),
      cadence: isHorizonCadence(item.cadence) ? item.cadence : ("monthly" as const),
      startDate: String(item.start_date).slice(0, 10),
      endDate: String(item.end_date).slice(0, 10),
    }));
  const horizonApplies = savedHorizonLines.some((line) =>
    horizonOverlapsRange(line.startDate, line.endDate, monthStart, yearEnd),
  );
  const templateIncome = annualTemplate ? Number(annualTemplate.planned_income) : null;
  const templateExpenses = annualTemplate
    ? sumAnnualPlannedExpenses(categories, annualTemplateItems)
    : null;
  const annualIncome = horizonApplies ? (comparison.hasPlan ? comparison.income.planned : 0) : templateIncome;
  const annualExpenses = horizonApplies ? 0 : templateExpenses;
  const monthPlanNet =
    comparison.hasPlan || annualIncome == null || annualExpenses == null
      ? comparison.balance.planned
      : annualIncome - annualExpenses;
  const forecast = buildPlanWealthForecast({
    wallets,
    transactionsBeforeMonth,
    investments,
    monthPlanNet,
    annualPlannedIncome: horizonApplies ? null : annualIncome,
    annualPlannedExpenses: horizonApplies ? null : annualExpenses,
    planMonthKey,
    planYear,
  });
  const monthlyIncome = comparison.hasPlan ? comparison.income.planned : (templateIncome ?? 0);
  const yearExpenses = horizonApplies
    ? sumHorizonExpenses(savedHorizonLines, monthStart, yearEnd)
    : 0;

  return {
    ...forecast,
    expectedYearEnd: horizonApplies
      ? forecast.monthStart + forecast.monthsLeftInYear * monthlyIncome - yearExpenses
      : forecast.expectedYearEnd,
    yearForecastSource: horizonApplies ? ("horizon" as const) : annualTemplate ? ("annual" as const) : null,
  };
}
