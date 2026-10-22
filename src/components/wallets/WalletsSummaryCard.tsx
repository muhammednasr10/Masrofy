"use client";

import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useFormat } from "@/hooks/useFormat";
import type { ParentWalletBalanceSummary } from "@/lib/wallets/hierarchy";

export default function WalletsSummaryCard({
  summary,
  currency,
}: {
  summary: ParentWalletBalanceSummary;
  currency: string;
}) {
  const t = useTranslations();
  const { formatCurrency } = useFormat();

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      <article className="rounded-3xl border border-white bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
        <p className="text-sm text-emerald-700">{t("wallets.liquidWealth")}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
          {formatCurrency(summary.liquidTotal, currency)}
        </p>
      </article>

      <article className="rounded-3xl border border-white bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
        <p className="text-sm text-amber-700">{t("wallets.investmentTotal")}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
          {formatCurrency(summary.investmentTotal, currency)}
        </p>
      </article>

      <article className="rounded-3xl border border-white bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm">
        <p className="text-sm text-rose-700">{t("wallets.creditTotal")}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
          {formatCurrency(summary.creditTotal, currency)}
        </p>
      </article>
    </section>
  );
}
