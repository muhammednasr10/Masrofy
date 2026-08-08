"use client";

import { useDashboardBalanceVisibility } from "@/components/dashboard/DashboardBalanceVisibility";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useFormat } from "@/hooks/useFormat";
import type { DashboardData } from "@/lib/dashboard";

type DashboardSummaryProps = {
  data: DashboardData;
};

export default function DashboardSummary({ data }: DashboardSummaryProps) {
  const t = useTranslations();
  const { formatCurrency } = useFormat();
  const { maskBalance } = useDashboardBalanceVisibility();

  const walletsAmount = maskBalance(formatCurrency(data.portfolio.assetTotal, data.currency));
  const expensesAmount = maskBalance(formatCurrency(data.summary.totalExpenses, data.currency));

  return (
    <section className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 sm:text-base">
      <p>
        {t("dashboard.summaryWallets", { amount: walletsAmount })}
      </p>
      <p>
        {t("dashboard.summaryExpenses", { amount: expensesAmount })}
      </p>
    </section>
  );
}
