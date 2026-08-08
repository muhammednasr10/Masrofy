"use client";

import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useFormat } from "@/hooks/useFormat";
import type { MonthlySummary } from "@/lib/types/database";

export default function CategoryBreakdownReport({
  summary,
  currency,
  formatAmount,
}: {
  summary: MonthlySummary;
  currency: string;
  formatAmount?: (value: number) => string;
}) {
  const t = useTranslations();
  const { formatCurrency } = useFormat();
  const displayAmount = formatAmount ?? ((value: number) => formatCurrency(value, currency));

  if (summary.byCategory.length === 0) {
    return <p className="text-sm text-slate-500">{t("reports.categoryEmpty")}</p>;
  }

  const maxTotal = summary.byCategory[0]?.total ?? 1;

  return (
    <>
      <div className="space-y-3 md:hidden">
        {summary.byCategory.map((category) => (
          <article key={category.categoryId ?? category.name} className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-900">
                <span>{category.icon}</span>
                <span className="truncate">{category.name}</span>
              </span>
              <span className="amount-text shrink-0 font-semibold text-slate-900">
                {displayAmount(category.total)}
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${Math.max(8, (category.total / maxTotal) * 100)}%`,
                  backgroundColor: category.color,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {t("reports.categoryPercentOfExpenses", {
                percent: ((category.total / summary.totalExpenses) * 100).toFixed(1),
              })}
            </p>
          </article>
        ))}
      </div>

      <div className="hidden x-scroll md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="px-3 py-3 text-start font-medium">{t("reports.categoryColumn")}</th>
              <th className="px-3 py-3 text-start font-medium">{t("reports.amountColumn")}</th>
              <th className="px-3 py-3 text-start font-medium">{t("reports.percentColumn")}</th>
              <th className="px-3 py-3 text-start font-medium">{t("reports.distributionColumn")}</th>
            </tr>
          </thead>
          <tbody>
            {summary.byCategory.map((category) => (
              <tr key={category.categoryId ?? category.name} className="border-b border-slate-100">
                <td className="px-3 py-4">
                  <span className="flex items-center gap-2 font-medium text-slate-900">
                    <span>{category.icon}</span>
                    {category.name}
                  </span>
                </td>
                <td className="amount-text px-3 py-4 font-medium text-slate-900">
                  {displayAmount(category.total)}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {((category.total / summary.totalExpenses) * 100).toFixed(1)}%
                </td>
                <td className="px-3 py-4">
                  <div className="h-2 min-w-[120px] rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.max(8, (category.total / maxTotal) * 100)}%`,
                        backgroundColor: category.color,
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
