"use client";

import Link from "@/components/router/Link";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useFormat } from "@/hooks/useFormat";
import { getMonthSpendLeft } from "@/lib/dashboard/spend-left";
import { requestQuickAdd } from "@/lib/expenses/quick-add";
import type { DashboardData } from "@/lib/dashboard";

export default function DashboardSpendLeft({ data }: { data: DashboardData }) {
  const t = useTranslations();
  const { formatCurrency } = useFormat();
  const spend = getMonthSpendLeft(data.planComparison);

  if (!spend.hasPlan) {
    return (
      <p className="text-sm text-slate-500">
        <Link href="/plan" className="font-medium text-emerald-700">
          {t("dashboard.spendNoPlan")}
        </Link>
      </p>
    );
  }

  const amount = formatCurrency(Math.abs(spend.remaining), data.currency);

  return (
    <div className="space-y-1">
      <p className={`text-base font-semibold sm:text-lg ${spend.remaining < 0 ? "text-red-600" : "text-emerald-800"}`}>
        <Link href="/plan">
          {spend.remaining < 0
            ? t("dashboard.spendOver", { amount })
            : t("dashboard.spendLeft", { amount })}
        </Link>
      </p>
      {spend.closest ? (
        <p className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <Link
            href={`/plan?category=${spend.closest.categoryId}`}
            className="underline decoration-slate-300 underline-offset-2"
          >
            {spend.closest.over
              ? t("dashboard.closestCategoryOver", {
                  icon: spend.closest.icon,
                  name: spend.closest.name,
                })
              : t("dashboard.closestCategory", {
                  icon: spend.closest.icon,
                  name: spend.closest.name,
                  percent: String(spend.closest.percent),
                })}
          </Link>
          <button
            type="button"
            onClick={() => requestQuickAdd(spend.closest?.categoryId)}
            className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100"
          >
            {t("dashboard.recordOnCategory")}
          </button>
        </p>
      ) : null}
    </div>
  );
}
