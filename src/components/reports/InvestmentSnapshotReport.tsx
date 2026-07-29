import { investmentTypeOptions } from "@/lib/constants/investment-options";
import type { summarizeInvestments } from "@/lib/investments/utils";
import { formatCurrency } from "@/lib/utils/format";

type InvestmentSummary = ReturnType<typeof summarizeInvestments>;

export default function InvestmentSnapshotReport({
  summary,
  currency,
  profitEntriesTotal,
}: {
  summary: InvestmentSummary;
  currency: string;
  profitEntriesTotal: number;
}) {
  if (summary.items.length === 0) {
    return <p className="text-sm text-slate-500">لا توجد استثمارات مسجّلة.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="rounded-2xl bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
        إجمالي الأرباح المسجّلة في السجل: {formatCurrency(profitEntriesTotal, currency)}
      </p>

      <div className="space-y-3 md:hidden">
        {summary.items.map(({ investment, profit, returnPercent, displayValue }) => {
          const typeLabel =
            investmentTypeOptions.find((item) => item.value === investment.investment_type)
              ?.label ?? investment.investment_type;

          return (
            <article key={investment.id} className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                  style={{ backgroundColor: `${investment.color}25` }}
                >
                  {investment.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{investment.name}</p>
                  <p className="text-xs text-slate-500">{typeLabel}</p>
                </div>
                <p className="font-semibold text-slate-900">
                  {formatCurrency(displayValue, currency)}
                </p>
              </div>
              <p
                className={`mt-2 text-sm font-medium ${
                  profit >= 0 ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {profit >= 0 ? "+" : ""}
                {formatCurrency(profit, currency)}
                {returnPercent != null ? ` (${returnPercent.toFixed(1)}%)` : ""}
              </p>
            </article>
          );
        })}
      </div>

      <div className="hidden x-scroll md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="px-3 py-3 text-right font-medium">الاستثمار</th>
              <th className="px-3 py-3 text-right font-medium">النوع</th>
              <th className="px-3 py-3 text-right font-medium">المستثمر</th>
              <th className="px-3 py-3 text-right font-medium">الحالي</th>
              <th className="px-3 py-3 text-right font-medium">الربح/الخسارة</th>
            </tr>
          </thead>
          <tbody>
            {summary.items.map(({ investment, profit, returnPercent, displayValue }) => {
              const typeLabel =
                investmentTypeOptions.find((item) => item.value === investment.investment_type)
                  ?.label ?? investment.investment_type;

              return (
                <tr key={investment.id} className="border-b border-slate-100">
                  <td className="px-3 py-4 font-medium text-slate-900">
                    {investment.icon} {investment.name}
                  </td>
                  <td className="px-3 py-4 text-slate-600">{typeLabel}</td>
                  <td className="px-3 py-4">
                    {formatCurrency(Number(investment.cost_basis), currency)}
                  </td>
                  <td className="px-3 py-4 font-medium text-slate-900">
                    {formatCurrency(displayValue, currency)}
                  </td>
                  <td
                    className={`px-3 py-4 font-semibold ${
                      profit >= 0 ? "text-emerald-700" : "text-red-600"
                    }`}
                  >
                    {profit >= 0 ? "+" : ""}
                    {formatCurrency(profit, currency)}
                    {returnPercent != null ? ` (${returnPercent.toFixed(1)}%)` : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
