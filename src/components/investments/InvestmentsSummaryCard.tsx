import { formatCurrency } from "@/lib/utils/format";

export default function InvestmentsSummaryCard({
  totalCostBasis,
  totalCurrentValue,
  totalProfit,
  totalReturnPercent,
  currency,
}: {
  totalCostBasis: number;
  totalCurrentValue: number;
  totalProfit: number;
  totalReturnPercent: number | null;
  currency: string;
}) {
  const profitTone = totalProfit >= 0 ? "text-emerald-700" : "text-red-600";

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      <article className="rounded-3xl border border-white bg-gradient-to-br from-slate-100 to-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">إجمالي المستثمر</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">
          {formatCurrency(totalCostBasis, currency)}
        </p>
      </article>
      <article className="rounded-3xl border border-white bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm">
        <p className="text-sm text-indigo-700">القيمة الحالية</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">
          {formatCurrency(totalCurrentValue, currency)}
        </p>
      </article>
      <article className="rounded-3xl border border-white bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
        <p className="text-sm text-emerald-700">الربح / الخسارة</p>
        <p className={`mt-2 text-2xl font-semibold ${profitTone}`}>
          {totalProfit >= 0 ? "+" : ""}
          {formatCurrency(totalProfit, currency)}
        </p>
        {totalReturnPercent != null ? (
          <p className={`mt-1 text-sm ${profitTone}`}>
            {totalReturnPercent >= 0 ? "+" : ""}
            {totalReturnPercent.toFixed(2)}%
          </p>
        ) : null}
      </article>
    </section>
  );
}
