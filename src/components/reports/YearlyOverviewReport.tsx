import { formatCurrency } from "@/lib/utils/format";

type YearlyOverview = {
  rows: Array<{
    planMonthKey: string;
    monthLabel: string;
    expenses: number;
    income: number;
    balance: number;
  }>;
  totals: {
    expenses: number;
    income: number;
    balance: number;
  };
  year: number;
};

export default function YearlyOverviewReport({
  overview,
  currency,
}: {
  overview: YearlyOverview;
  currency: string;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl bg-red-50 p-4">
          <p className="text-xs text-red-700">مصروفات {overview.year}</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {formatCurrency(overview.totals.expenses, currency)}
          </p>
        </article>
        <article className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-xs text-emerald-700">دخل {overview.year}</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {formatCurrency(overview.totals.income, currency)}
          </p>
        </article>
        <article className="rounded-2xl bg-slate-100 p-4">
          <p className="text-xs text-slate-600">صافي {overview.year}</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {formatCurrency(overview.totals.balance, currency)}
          </p>
        </article>
      </div>

      <div className="x-scroll rounded-2xl border border-slate-100">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <th className="px-3 py-3 text-right font-medium">الشهر</th>
              <th className="px-3 py-3 text-right font-medium">مصروفات</th>
              <th className="px-3 py-3 text-right font-medium">دخل</th>
              <th className="px-3 py-3 text-right font-medium">الصافي</th>
            </tr>
          </thead>
          <tbody>
            {overview.rows.map((row) => (
              <tr key={row.planMonthKey} className="border-b border-slate-100">
                <td className="px-3 py-3 font-medium text-slate-900">{row.monthLabel}</td>
                <td className="px-3 py-3 text-red-600">{formatCurrency(row.expenses, currency)}</td>
                <td className="px-3 py-3 text-emerald-700">{formatCurrency(row.income, currency)}</td>
                <td
                  className={`px-3 py-3 font-semibold ${
                    row.balance >= 0 ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {formatCurrency(row.balance, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
