import type { Investment, InvestmentProfitEntry } from "@/lib/types/database";

export type InvestmentProfitFormState = {
  profitAmount: string;
  periodStart: string;
  periodEnd: string;
  note: string;
};

export function emptyInvestmentProfitForm(): InvestmentProfitFormState {
  return {
    profitAmount: "",
    periodStart: "",
    periodEnd: new Date().toISOString().slice(0, 10),
    note: "",
  };
}

export function sumProfitEntries(entries: InvestmentProfitEntry[]) {
  return entries.reduce((total, entry) => total + Number(entry.profit_amount), 0);
}

export function getVariableInvestmentValue(
  investment: Pick<Investment, "cost_basis">,
  entries: InvestmentProfitEntry[],
) {
  return Number(investment.cost_basis) + sumProfitEntries(entries);
}

export function getLatestProfitEntry(entries: InvestmentProfitEntry[]) {
  return [...entries].sort((a, b) => b.period_end.localeCompare(a.period_end))[0] ?? null;
}

export function validateInvestmentProfitForm(form: InvestmentProfitFormState) {
  if (!form.profitAmount.trim() || Number.isNaN(Number(form.profitAmount))) {
    return "أدخل مبلغ الربح أو الخسارة.";
  }

  if (!form.periodEnd.trim()) {
    return "اختر نهاية الفترة.";
  }

  if (
    form.periodStart.trim() &&
    form.periodEnd.trim() &&
    form.periodStart > form.periodEnd
  ) {
    return "بداية الفترة يجب أن تكون قبل نهايتها.";
  }

  return null;
}

export function formatProfitPeriod(entry: InvestmentProfitEntry) {
  if (entry.period_start) {
    return `${entry.period_start} → ${entry.period_end}`;
  }

  return `حتى ${entry.period_end}`;
}
