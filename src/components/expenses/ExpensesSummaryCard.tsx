"use client";

import { useFormat } from "@/hooks/useFormat";
import { useTranslations } from "@/components/i18n/LocaleProvider";

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
  const t = useTranslations();
  const { formatCurrency } = useFormat();

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm text-emerald-700">{t("expenses.monthSummaryLabel")}</p>
        <h2 className="text-2xl font-semibold text-slate-900">{monthLabel}</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-3xl border border-white bg-gradient-to-br from-red-50 to-white p-6 shadow-sm">
          <p className="text-sm text-red-700">{t("expenses.totalExpenses")}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {formatCurrency(totalExpenses, currency)}
          </p>
        </article>
        <article className="rounded-3xl border border-white bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
          <p className="text-sm text-emerald-700">{t("expenses.totalIncome")}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {formatCurrency(totalIncome, currency)}
          </p>
        </article>
        <article className="rounded-3xl border border-white bg-gradient-to-br from-slate-100 to-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">{t("expenses.monthBalance")}</p>
          <p className="mt-1 text-xs text-slate-500">{t("expenses.netBalanceHint")}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {formatCurrency(balance, currency)}
          </p>
        </article>
      </div>
    </section>
  );
}
