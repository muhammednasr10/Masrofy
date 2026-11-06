"use client";

import { useState } from "react";
import Link from "@/components/router/Link";
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
    <section className="rounded-2xl border border-white bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">{t("dashboard.categoryReportTitle")}</h2>
        <Link
          href="/reports#categories"
          className="shrink-0 text-xs font-medium text-emerald-700"
        >
          {t("dashboard.categoryReportLink")}
        </Link>
      </div>

      <CategoryBreakdownReport
        summary={data.summary}
        currency={data.currency}
        formatAmount={formatAmount}
        onCategorySelect={setSelectedCategory}
        openDetailsLabel=""
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
