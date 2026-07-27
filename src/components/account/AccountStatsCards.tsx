"use client";

import type { AccountStats } from "@/lib/account/load-data";
import { useTranslations } from "@/components/i18n/LocaleProvider";

type AccountStatsCardsProps = {
  stats: AccountStats;
};

export default function AccountStatsCards({ stats }: AccountStatsCardsProps) {
  const t = useTranslations();

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      <StatCard title={t("account.statsWallets")} value={String(stats.walletsCount)} />
      <StatCard title={t("account.statsCategories")} value={String(stats.categoriesCount)} />
      <StatCard title={t("account.statsTransactions")} value={String(stats.transactionsCount)} />
    </section>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-3xl border border-white bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </article>
  );
}
