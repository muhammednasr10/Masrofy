"use client";

import EmptyState from "@/components/ui/EmptyState";
import CategoryDistributionBar from "@/components/reports/CategoryDistributionBar";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useFormat } from "@/hooks/useFormat";
import type { MonthlySummary } from "@/lib/types/database";

type CategoryRow = MonthlySummary["byCategory"][number];

export default function CategoryBreakdownReport({
  summary,
  currency,
  formatAmount,
  onCategorySelect,
  openDetailsLabel,
}: {
  summary: MonthlySummary;
  currency: string;
  formatAmount?: (value: number) => string;
  onCategorySelect?: (category: CategoryRow) => void;
  openDetailsLabel?: string;
}) {
  const t = useTranslations();
  const { formatCurrency } = useFormat();
  const displayAmount = formatAmount ?? ((value: number) => formatCurrency(value, currency));
  const detailsHint = openDetailsLabel ?? t("dashboard.categoryOpenExpenses");

  if (summary.byCategory.length === 0) {
    return <EmptyState message={t("reports.categoryEmpty")} className="" />;
  }

  const maxTotal = summary.byCategory[0]?.total ?? 1;

  function handleSelect(category: CategoryRow) {
    onCategorySelect?.(category);
  }

  const rowClassName = onCategorySelect
    ? "cursor-pointer transition hover:bg-slate-50/80"
    : "";

  return (
    <>
      <div className="space-y-3 md:hidden">
        {summary.byCategory.map((category) => (
          <article
            key={category.categoryId ?? category.name}
            className={`rounded-2xl bg-slate-50 p-4 ${rowClassName}`}
          >
            {onCategorySelect ? (
              <button
                type="button"
                onClick={() => handleSelect(category)}
                className="w-full text-start"
              >
                <CategoryRowContent
                  category={category}
                  summary={summary}
                  maxTotal={maxTotal}
                  displayAmount={displayAmount}
                  detailsHint={detailsHint}
                  t={t}
                />
              </button>
            ) : (
              <CategoryRowContent
                category={category}
                summary={summary}
                maxTotal={maxTotal}
                displayAmount={displayAmount}
                detailsHint={detailsHint}
                t={t}
                showHint={false}
              />
            )}
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
              <tr
                key={category.categoryId ?? category.name}
                className={`border-b border-slate-100 ${rowClassName}`}
                onClick={onCategorySelect ? () => handleSelect(category) : undefined}
                onKeyDown={
                  onCategorySelect
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleSelect(category);
                        }
                      }
                    : undefined
                }
                tabIndex={onCategorySelect ? 0 : undefined}
                role={onCategorySelect ? "button" : undefined}
              >
                <td className="px-3 py-4">
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex items-center gap-2 font-medium text-slate-900">
                      <span>{category.icon}</span>
                      {category.name}
                    </span>
                    {onCategorySelect ? (
                      <span className="text-xs font-normal text-emerald-700">{detailsHint}</span>
                    ) : null}
                  </span>
                </td>
                <td className="amount-inline px-3 py-4 font-medium text-slate-900">
                  {displayAmount(category.total)}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {((category.total / summary.totalExpenses) * 100).toFixed(1)}%
                </td>
                <td className="px-3 py-4">
                  <div className="min-w-[120px]">
                    <CategoryDistributionBar
                      total={category.total}
                      maxTotal={maxTotal}
                      color={category.color}
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

function CategoryRowContent({
  category,
  summary,
  maxTotal,
  displayAmount,
  detailsHint,
  t,
  showHint = true,
}: {
  category: CategoryRow;
  summary: MonthlySummary;
  maxTotal: number;
  displayAmount: (value: number) => string;
  detailsHint: string;
  t: ReturnType<typeof useTranslations>;
  showHint?: boolean;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-900">
          <span>{category.icon}</span>
          <span className="truncate">{category.name}</span>
        </span>
        <span className="amount-inline shrink-0 text-slate-900">{displayAmount(category.total)}</span>
      </div>
      <CategoryDistributionBar
        total={category.total}
        maxTotal={maxTotal}
        color={category.color}
        trackClassName="mt-2 h-2 rounded-full bg-white"
      />
      <p className="mt-1 text-xs text-slate-500">
        {t("reports.categoryPercentOfExpenses", {
          percent: ((category.total / summary.totalExpenses) * 100).toFixed(1),
        })}
      </p>
      {showHint ? (
        <p className="mt-2 text-xs font-medium text-emerald-700">{detailsHint}</p>
      ) : null}
    </>
  );
}
