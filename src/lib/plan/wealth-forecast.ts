import { categoryPlansFromTemplateItems } from "@/lib/plan/annual";
import type {
  AnnualPlanTemplateItem,
  Category,
  Investment,
  Transaction,
  Wallet,
} from "@/lib/types/database";
import { summarizePortfolioWealth } from "@/lib/wallets/reconciliation";

export function sumAnnualPlannedExpenses(
  categories: Category[],
  items: AnnualPlanTemplateItem[],
) {
  const plans = categoryPlansFromTemplateItems(categories, items);

  return Object.values(plans).reduce((total, value) => total + (Number(value) || 0), 0);
}

export function monthsLeftInPlanYear(planMonthKey: string, planYear: number) {
  const [yearText, monthText] = planMonthKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (year !== planYear || !Number.isInteger(month) || month < 1 || month > 12) {
    return 0;
  }

  return 12 - month + 1;
}

export function buildPlanWealthForecast({
  wallets,
  transactionsBeforeMonth,
  investments = [],
  monthPlanNet,
  annualPlannedIncome,
  annualPlannedExpenses,
  planMonthKey,
  planYear,
}: {
  wallets: Wallet[];
  transactionsBeforeMonth: Transaction[];
  investments?: Investment[];
  monthPlanNet: number;
  annualPlannedIncome: number | null;
  annualPlannedExpenses: number | null;
  planMonthKey: string;
  planYear: number;
}) {
  const monthStart = summarizePortfolioWealth(
    wallets,
    transactionsBeforeMonth,
    investments,
  ).assetTotal;
  const expectedMonthEnd = monthStart + monthPlanNet;
  const monthsLeftInYear = monthsLeftInPlanYear(planMonthKey, planYear);
  const hasAnnualPlan = annualPlannedIncome != null && annualPlannedExpenses != null;

  return {
    monthStart,
    expectedMonthEnd,
    expectedYearEnd: hasAnnualPlan
      ? monthStart + monthsLeftInYear * (annualPlannedIncome - annualPlannedExpenses)
      : null,
    monthsLeftInYear,
  };
}
