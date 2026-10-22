"use client";

import type { OverviewPeriodRow } from "@/lib/plan/overview-rates";
import { formatCurrency } from "@/lib/utils/format";

export default function SandboxPeriodEditRow({
  row,
  currency,
  onIncomeChange,
  onExpenseChange,
}: {
  row: OverviewPeriodRow;
  currency: string;
  onIncomeChange: (value: string) => void;
  onExpenseChange: (value: string) => void;
}) {
  const differenceClass = row.difference >= 0 ? "text-emerald-700" : "text-red-600";

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td data-span className="px-4 py-3 font-medium text-slate-900">{row.label}</td>
      <td data-label="الدخل" className="px-4 py-3">
        <input
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          value={Number.isFinite(row.income) ? row.income : 0}
          onChange={(event) => onIncomeChange(event.target.value)}
          className="w-full min-w-0 rounded-xl border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-right text-emerald-800 outline-none focus:border-emerald-500 md:min-w-[7rem]"
        />
      </td>
      <td data-label="المصروف" className="px-4 py-3">
        <input
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          value={Number.isFinite(row.expense) ? row.expense : 0}
          onChange={(event) => onExpenseChange(event.target.value)}
          className="w-full min-w-0 rounded-xl border border-red-200 bg-red-50/40 px-3 py-2 text-right text-red-800 outline-none focus:border-red-400 md:min-w-[7rem]"
        />
      </td>
      <td data-label="الفرق" className={`px-4 py-3 font-medium ${differenceClass}`}>
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
