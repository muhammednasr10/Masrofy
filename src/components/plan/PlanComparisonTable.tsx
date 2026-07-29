import { formatCurrency } from "@/lib/utils/format";
import type { PlanComparison } from "@/lib/types/database";

export default function PlanComparisonTable({
  comparison,
  currency,
}: {
  comparison: PlanComparison;
  currency: string;
}) {
  return (
    <div className="x-scroll rounded-2xl border border-slate-100">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <th className="px-4 py-3 text-right font-medium">الفئة</th>
            <th className="px-4 py-3 text-right font-medium">المخطط</th>
            <th className="px-4 py-3 text-right font-medium">الواقع</th>
            <th className="px-4 py-3 text-right font-medium">الفرق</th>
            <th className="px-4 py-3 text-right font-medium">التقدم</th>
          </tr>
        </thead>
        <tbody>
          {comparison.expenseRows.map((row) => {
            const overBudget = row.planned > 0 && row.actual > row.planned;
            const underBudget = row.planned > 0 && row.actual < row.planned;

            return (
              <tr key={row.categoryId} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-4">
                  <span className="flex items-center gap-2 font-medium text-slate-900">
                    <span>{row.icon}</span>
                    {row.name}
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-700">
                  {formatCurrency(row.planned, currency)}
                </td>
                <td className="px-4 py-4 font-medium text-slate-900">
                  {formatCurrency(row.actual, currency)}
                </td>
                <td
                  className={`px-4 py-4 font-medium ${
                    row.difference === 0
                      ? "text-slate-500"
                      : overBudget
                        ? "text-red-600"
                        : underBudget
                          ? "text-emerald-700"
                          : "text-slate-700"
                  }`}
                >
                  {row.difference === 0
                    ? formatCurrency(0, currency)
                    : `${row.difference > 0 ? "+" : ""}${formatCurrency(row.difference, currency)}`}
                </td>
                <td className="px-4 py-4">
                  {row.planned > 0 ? (
                    <div className="space-y-1">
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className={`h-2 rounded-full ${
                            overBudget ? "bg-red-500" : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${Math.min(100, row.progressPercent ?? 0)}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        {Math.round(row.progressPercent ?? 0)}%
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {comparison.uncategorizedExpenses > 0 ? (
        <div className="border-t border-slate-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          مصروفات بدون فئة هذا الشهر:{" "}
          {formatCurrency(comparison.uncategorizedExpenses, currency)}
        </div>
      ) : null}
    </div>
  );
}
