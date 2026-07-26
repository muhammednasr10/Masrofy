import type { MonthlyTrendRow } from "@/lib/reports";
import { formatCurrency } from "@/lib/utils/format";

export default function MonthlyTrendReport({
  rows,
  currency,
}: {
  rows: MonthlyTrendRow[];
  currency: string;
}) {
  const maxValue = Math.max(...rows.map((row) => Math.max(row.expenses, row.income)), 1);

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <article key={row.planMonthKey} className="rounded-2xl bg-slate-50 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium text-slate-900">{row.monthLabel}</p>
            <p
              className={`text-sm font-semibold ${
                row.balance >= 0 ? "text-emerald-700" : "text-red-600"
              }`}
            >
              صافي: {formatCurrency(row.balance, currency)}
            </p>
          </div>

          <div className="mt-3 space-y-2">
            <div>
              <div className="mb-1 flex justify-between text-xs text-red-600">
                <span>مصروفات</span>
                <span>{formatCurrency(row.expenses, currency)}</span>
              </div>
              <div className="h-2 rounded-full bg-white">
                <div
                  className="h-2 rounded-full bg-red-400"
                  style={{ width: `${Math.max(4, (row.expenses / maxValue) * 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-emerald-700">
                <span>دخل</span>
                <span>{formatCurrency(row.income, currency)}</span>
              </div>
              <div className="h-2 rounded-full bg-white">
                <div
                  className="h-2 rounded-full bg-emerald-500"
                  style={{ width: `${Math.max(4, (row.income / maxValue) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
