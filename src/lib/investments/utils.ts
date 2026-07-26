import type { CollectionPeriod, Investment } from "@/lib/types/database";

export type CollectionStatus = "pending" | "due_today" | "overdue" | "collected";

export function getCollectionPeriodLabel(period: CollectionPeriod | null | undefined) {
  if (period === "monthly") {
    return "شهري";
  }

  return "سنوي";
}

export function getFixedReturnPercentLabel(period: CollectionPeriod | null | undefined) {
  if (period === "monthly") {
    return "نسبة الربح الشهرية (%)";
  }

  return "نسبة الربح السنوية (%)";
}

export function getExpectedProfitLabel(period: CollectionPeriod | null | undefined) {
  if (period === "monthly") {
    return "الربح المتوقع (شهريًا)";
  }

  return "الربح المتوقع (سنويًا)";
}

export function getCollectionDateLabel(period: CollectionPeriod | null | undefined) {
  if (period === "monthly") {
    return "ميعاد القبض الشهري";
  }

  return "ميعاد القبض السنوي";
}

export function isFixedReturnInvestment(investment: Pick<Investment, "is_fixed_return">) {
  return investment.is_fixed_return;
}

export function getFixedProfitAmount(
  investment: Pick<Investment, "cost_basis" | "fixed_return_percent">,
) {
  if (investment.fixed_return_percent == null) {
    return 0;
  }

  return Number(investment.cost_basis) * (Number(investment.fixed_return_percent) / 100);
}

export function getInvestmentMaturityValue(investment: Investment) {
  if (investment.is_fixed_return && investment.fixed_return_percent != null) {
    return Number(investment.cost_basis) + getFixedProfitAmount(investment);
  }

  return Number(investment.current_value);
}

export function isInvestmentCollected(investment: Investment) {
  if (!investment.is_fixed_return) {
    return false;
  }

  return Number(investment.current_value) >= getInvestmentMaturityValue(investment);
}

export function getCollectionStatus(investment: Investment): CollectionStatus | null {
  if (!investment.is_fixed_return || !investment.collection_date) {
    return null;
  }

  if (isInvestmentCollected(investment)) {
    return "collected";
  }

  const today = new Date().toISOString().slice(0, 10);

  if (today < investment.collection_date) {
    return "pending";
  }

  if (today === investment.collection_date) {
    return "due_today";
  }

  return "overdue";
}

export function getDaysUntilCollection(investment: Investment) {
  if (!investment.collection_date) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const collectionDate = new Date(`${investment.collection_date}T00:00:00`);
  const diffMs = collectionDate.getTime() - today.getTime();

  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function getCollectionStatusLabel(status: CollectionStatus) {
  switch (status) {
    case "pending":
      return "قيد الانتظار";
    case "due_today":
      return "مستحق اليوم";
    case "overdue":
      return "متأخر القبض";
    case "collected":
      return "تم القبض";
  }
}

export function calculateInvestmentProfit(investment: Investment) {
  if (investment.is_fixed_return && investment.fixed_return_percent != null) {
    if (isInvestmentCollected(investment)) {
      return Number(investment.current_value) - Number(investment.cost_basis);
    }

    return getFixedProfitAmount(investment);
  }

  return Number(investment.current_value) - Number(investment.cost_basis);
}

export function calculateInvestmentReturnPercent(investment: Investment) {
  if (investment.is_fixed_return && investment.fixed_return_percent != null) {
    if (isInvestmentCollected(investment)) {
      const cost = Number(investment.cost_basis);

      if (cost <= 0) {
        return null;
      }

      return (calculateInvestmentProfit(investment) / cost) * 100;
    }

    return Number(investment.fixed_return_percent);
  }

  const cost = Number(investment.cost_basis);

  if (cost <= 0) {
    return null;
  }

  return (calculateInvestmentProfit(investment) / cost) * 100;
}

export function getInvestmentDisplayValue(investment: Investment) {
  if (investment.is_fixed_return && !isInvestmentCollected(investment)) {
    return getInvestmentMaturityValue(investment);
  }

  return Number(investment.current_value);
}

export function summarizeInvestments(investments: Investment[]) {
  const totalCostBasis = investments.reduce(
    (sum, investment) => sum + Number(investment.cost_basis),
    0,
  );
  const totalCurrentValue = investments.reduce(
    (sum, investment) => sum + getInvestmentDisplayValue(investment),
    0,
  );
  const totalProfit = totalCurrentValue - totalCostBasis;
  const totalReturnPercent =
    totalCostBasis > 0 ? (totalProfit / totalCostBasis) * 100 : null;

  return {
    totalCostBasis,
    totalCurrentValue,
    totalProfit,
    totalReturnPercent,
    items: investments.map((investment) => ({
      investment,
      profit: calculateInvestmentProfit(investment),
      returnPercent: calculateInvestmentReturnPercent(investment),
      collectionStatus: getCollectionStatus(investment),
      daysUntilCollection: getDaysUntilCollection(investment),
      displayValue: getInvestmentDisplayValue(investment),
    })),
  };
}

export function sortInvestments(investments: Investment[]) {
  return [...investments].sort((a, b) => a.sort_order - b.sort_order);
}

export function normalizeInvestment(investment: Investment): Investment {
  return {
    ...investment,
    is_fixed_return: investment.is_fixed_return ?? false,
    fixed_return_percent: investment.fixed_return_percent ?? null,
    collection_period: investment.collection_period ?? "annual",
    collection_date: investment.collection_date ?? null,
  };
}

export function normalizeInvestments(investments: Investment[]) {
  return investments.map(normalizeInvestment);
}

export function validateInvestmentForm(form: {
  isFixedReturn: boolean;
  fixedReturnPercent: string;
  collectionDate: string;
}) {
  if (!form.isFixedReturn) {
    return null;
  }

  if (!form.fixedReturnPercent.trim() || Number(form.fixedReturnPercent) < 0) {
    return "أدخل نسبة ربح ثابتة صحيحة.";
  }

  if (!form.collectionDate.trim()) {
    return "اختر ميعاد القبض.";
  }

  return null;
}

export function getFixedProfitAmountFromForm(costBasis: string, fixedReturnPercent: string) {
  const cost = Number(costBasis) || 0;
  const percent = Number(fixedReturnPercent) || 0;
  return cost * (percent / 100);
}

export function syncFixedReturnCurrentValue(form: {
  isFixedReturn: boolean;
  costBasis: string;
  fixedReturnPercent: string;
  currentValue: string;
}) {
  if (!form.isFixedReturn) {
    return form.currentValue;
  }

  const cost = Number(form.costBasis) || 0;
  const profit = getFixedProfitAmountFromForm(form.costBasis, form.fixedReturnPercent);
  return String(cost + profit);
}
