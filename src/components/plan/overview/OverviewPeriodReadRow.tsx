"use client";

import type { OverviewPeriodRow } from "@/lib/plan/overview-rates";
import { formatCurrency } from "@/lib/utils/format";

export default function OverviewPeriodReadRow({
  row,
  currency,
}: {
  row: OverviewPeriodRow;
  currency: string;
}) {
  const current = Boolean(row.isCurrentPeriod);
  const plannedIncome = row.plannedIncome ?? row.income;
  const plannedExpense = row.plannedExpense ?? row.expense;
  const plannedDifference = row.plannedDifference ?? row.difference;

  const incomeClass = current
    ? row.income >= plannedIncome
      ? "text-emerald-700 font-semibold"
      : "text-amber-700 font-semibold"
    : "text-emerald-700";

  const expenseClass = current
    ? row.expense <= plannedExpense
      ? "text-emerald-700 font-semibold"
      : "text-red-700 font-semibold"
    : "text-red-700";

  const differenceClass = row.difference >= 0 ? "text-emerald-700" : "text-red-600";

  return (
    <tr
      className={`border-b border-slate-100 last:border-0 ${
        current ? "bg-emerald-50/50" : ""
      }`}
    >
      <td data-span className="px-4 py-3 font-medium text-slate-900">
        {row.label}
        {current ? (
          <span className="ms-2 rounded-md bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800">
            الشهر المفتوح
          </span>
        ) : null}
      </td>
      <td
        data-label="الدخل"
        className={`px-4 py-3 ${incomeClass}`}
        title={current ? `المخطط: ${formatCurrency(plannedIncome, currency)}` : undefined}
      >
        {formatCurrency(row.income, currency)}
        {current ? <span className="block text-xs font-normal text-slate-400">واقع</span> : null}
      </td>
      <td
        data-label="المصروف"
        className={`px-4 py-3 ${expenseClass}`}
        title={current ? `المخطط: ${formatCurrency(plannedExpense, currency)}` : undefined}
      >
        {formatCurrency(row.expense, currency)}
        {current ? <span className="block text-xs font-normal text-slate-400">واقع</span> : null}
      </td>
      <td
        data-label="الفرق"
        className={`px-4 py-3 font-medium ${differenceClass}`}
        title={
          current ? `فرق المخطط: ${formatCurrency(plannedDifference, currency)}` : undefined
        }
      >
        {formatCurrency(row.difference, currency)}
      </td>
      <td
        data-label="الفرق التراكمي"
        className={`px-4 py-3 font-semibold ${
          row.cumulativeDifference >= 0 ? "text-emerald-800" : "text-red-700"
        }`}
      >
        {formatCurrency(row.cumulativeDifference, currency)}
      </td>
    </tr>
  );
}
