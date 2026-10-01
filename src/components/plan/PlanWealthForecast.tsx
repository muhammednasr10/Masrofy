import { formatCurrency } from "@/lib/utils/format";

export default function PlanWealthForecast({
  monthStart,
  expectedMonthEnd,
  expectedYearEnd,
  monthsLeftInYear,
  planYear,
  yearForecastSource,
  currency,
}: {
  monthStart: number;
  expectedMonthEnd: number;
  expectedYearEnd: number | null;
  monthsLeftInYear: number;
  planYear: number;
  yearForecastSource: "horizon" | "annual" | null;
  currency: string;
}) {
  return (
    <section className="grid gap-4 rounded-3xl border border-white bg-white p-6 shadow-sm lg:grid-cols-3">
      <ForecastLine label="بداية الشهر" amount={monthStart} currency={currency} />
      <ForecastLine label="المتوقع نهاية الشهر" amount={expectedMonthEnd} currency={currency} />
      <div>
        <p className="text-sm text-slate-500">المتوقع نهاية السنة</p>
        {expectedYearEnd == null ? (
          <p className="mt-1 text-sm font-medium text-slate-700">
            {yearForecastSource === "annual"
              ? `لسه مفيش خطة افتراضية لسنة ${planYear}`
              : "لسه مفيش خطة كاملة تغطي الشهر ده"}
          </p>
        ) : (
          <>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {formatCurrency(expectedYearEnd, currency)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {yearForecastSource === "horizon"
                ? "مصروف الخطة الكاملة محسوب لحد آخر السنة"
                : `من الخطة الافتراضية على ${monthsLeftInYear} شهور لحد آخر ${planYear}`}
            </p>
          </>
        )}
      </div>
    </section>
  );
}

function ForecastLine({
  label,
  amount,
  currency,
}: {
  label: string;
  amount: number;
  currency: string;
}) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(amount, currency)}</p>
    </div>
  );
}
