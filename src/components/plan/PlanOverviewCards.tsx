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

function PlanStatCard({
  title,
  titleClassName,
  cardClassName,
  planned,
  actual,
  difference,
  currency,
  invertDifference = false,
}: {
  title: string;
  titleClassName: string;
  cardClassName: string;
  planned: number;
  actual: number;
  difference: number;
  currency: string;
  invertDifference?: boolean;
}) {
  return (
    <article className={`rounded-3xl border border-white p-6 shadow-sm ${cardClassName}`}>
      <p className={`text-sm ${titleClassName}`}>{title}</p>
      <p className="mt-3 text-sm text-slate-500">
        المخطط{" "}
        <span className="text-lg font-semibold text-slate-900">
          {formatCurrency(planned, currency)}
        </span>
      </p>
      <p className="mt-1 text-sm text-slate-500">
        الواقع{" "}
        <span className="text-lg font-semibold text-slate-900">
          {formatCurrency(actual, currency)}
        </span>
      </p>
      <p className={`mt-1 text-sm font-medium ${toneClass(difference, invertDifference)}`}>
        الفرق {formatDifference(difference)}
      </p>
    </article>
  );
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
      <PlanStatCard
        title="الدخل"
        titleClassName="text-emerald-700"
        cardClassName="bg-gradient-to-br from-emerald-50 to-white"
        planned={comparison.income.planned}
        actual={comparison.income.actual}
        difference={comparison.income.difference}
        currency={currency}
      />
      <PlanStatCard
        title="المصروفات"
        titleClassName="text-red-700"
        cardClassName="bg-gradient-to-br from-red-50 to-white"
        planned={comparison.expenses.planned}
        actual={comparison.expenses.actual}
        difference={comparison.expenses.difference}
        currency={currency}
        invertDifference
      />
      <PlanStatCard
        title="الرصيد"
        titleClassName="text-slate-600"
        cardClassName="bg-gradient-to-br from-slate-100 to-white"
        planned={comparison.balance.planned}
        actual={comparison.balance.actual}
        difference={comparison.balance.difference}
        currency={currency}
      />
    </section>
  );
}
