import { formatCurrency } from "@/lib/utils/format";
import type { PlanComparison } from "@/lib/types/database";

function toneClass(difference: number, invert = false) {
  const value = invert ? -difference : difference;

  if (value > 0) {
    return "text-emerald-700";
  }

  if (value < 0) {
    return "text-red-600";
  }

  return "text-slate-700";
}

function formatDifference(difference: number) {
  if (difference === 0) {
    return formatCurrency(0);
  }

  return `${difference > 0 ? "+" : ""}${formatCurrency(difference)}`;
}

export default function PlanOverviewCards({
  comparison,
  currency,
}: {
  comparison: PlanComparison;
  currency: string;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <article className="rounded-3xl border border-white bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
        <p className="text-sm text-emerald-700">الدخل — مخطط / واقع</p>
        <p className="mt-2 text-lg font-semibold text-slate-900">
          {formatCurrency(comparison.income.planned, currency)} /{" "}
          {formatCurrency(comparison.income.actual, currency)}
        </p>
        <p className={`mt-2 text-sm font-medium ${toneClass(comparison.income.difference)}`}>
          الفرق: {formatDifference(comparison.income.difference)}
        </p>
      </article>

      <article className="rounded-3xl border border-white bg-gradient-to-br from-red-50 to-white p-6 shadow-sm">
        <p className="text-sm text-red-700">المصروفات — مخطط / واقع</p>
        <p className="mt-2 text-lg font-semibold text-slate-900">
          {formatCurrency(comparison.expenses.planned, currency)} /{" "}
          {formatCurrency(comparison.expenses.actual, currency)}
        </p>
        <p
          className={`mt-2 text-sm font-medium ${toneClass(comparison.expenses.difference, true)}`}
        >
          الفرق: {formatDifference(comparison.expenses.difference)}
        </p>
      </article>

      <article className="rounded-3xl border border-white bg-gradient-to-br from-slate-100 to-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">الرصيد — مخطط / واقع</p>
        <p className="mt-2 text-lg font-semibold text-slate-900">
          {formatCurrency(comparison.balance.planned, currency)} /{" "}
          {formatCurrency(comparison.balance.actual, currency)}
        </p>
        <p className={`mt-2 text-sm font-medium ${toneClass(comparison.balance.difference)}`}>
          الفرق: {formatDifference(comparison.balance.difference)}
        </p>
      </article>
    </section>
  );
}
