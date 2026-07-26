import { formatCurrency } from "@/lib/utils/format";

export default function ExpensesSummaryCard({
  monthLabel,
  totalExpenses,
  totalIncome,
  balance,
  currency,
}: {
  monthLabel: string;
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  currency: string;
}) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm text-emerald-700">ملخص الشهر</p>
        <h2 className="text-2xl font-semibold text-slate-900">{monthLabel}</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-3xl border border-white bg-gradient-to-br from-red-50 to-white p-6 shadow-sm">
          <p className="text-sm text-red-700">إجمالي المصروفات</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {formatCurrency(totalExpenses, currency)}
          </p>
        </article>
        <article className="rounded-3xl border border-white bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
          <p className="text-sm text-emerald-700">إجمالي الدخل</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {formatCurrency(totalIncome, currency)}
          </p>
        </article>
        <article className="rounded-3xl border border-white bg-gradient-to-br from-slate-100 to-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">صافي الشهر</p>
          <p className="mt-1 text-xs text-slate-500">دخل − مصروفات</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {formatCurrency(balance, currency)}
          </p>
        </article>
      </div>
    </section>
  );
}
