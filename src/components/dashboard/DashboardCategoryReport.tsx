"use client";

import { useState } from "react";
import Link from "next/link";
import CategoryBreakdownReport from "@/components/reports/CategoryBreakdownReport";
import CategoryExpensesModal from "@/components/dashboard/CategoryExpensesModal";
import { useDashboardBalanceVisibility } from "@/components/dashboard/DashboardBalanceVisibility";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useFormat } from "@/hooks/useFormat";
import type { DashboardData } from "@/lib/dashboard";
import type { MonthlySummary } from "@/lib/types/database";

type DashboardCategoryReportProps = {
  data: DashboardData;
};

export default function DashboardCategoryReport({ data }: DashboardCategoryReportProps) {
  const t = useTranslations();
  const { formatCurrency } = useFormat();
  const { maskBalance } = useDashboardBalanceVisibility();
  const [selectedCategory, setSelectedCategory] = useState<
    MonthlySummary["byCategory"][number] | null
  >(null);
  const formatAmount = (value: number) =>
    maskBalance(formatCurrency(value, data.currency));

  return (
    <section className="rounded-3xl border border-white bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t("dashboard.categoryReportTitle")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("dashboard.categoryReportDesc")}</p>
        </div>
        <Link
          href="/reports#categories"
          className="shrink-0 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          {t("dashboard.categoryReportLink")}
        </Link>
      </div>

      <CategoryBreakdownReport
        summary={data.summary}
        currency={data.currency}
        formatAmount={formatAmount}
        onCategorySelect={setSelectedCategory}
        openDetailsLabel={t("dashboard.categoryOpenExpenses")}
      />

      {selectedCategory ? (
        <CategoryExpensesModal
          category={selectedCategory}
          transactions={data.monthTransactions}
          currency={data.currency}
          monthLabel={data.monthLabel}
          formatAmount={formatAmount}
          onClose={() => setSelectedCategory(null)}
        />
      ) : null}
    </section>
  );
}
