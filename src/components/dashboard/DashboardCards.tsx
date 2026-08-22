"use client";

import Link from "next/link";
import DashboardSectionCard from "@/components/dashboard/DashboardSectionCard";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useDashboardCards } from "@/hooks/useDashboardCards";
import type { DashboardData } from "@/lib/dashboard";

type DashboardCardsProps = {
  data: DashboardData;
};

export default function DashboardCards({ data }: DashboardCardsProps) {
  const t = useTranslations();
  const { primaryCards, moreLinks } = useDashboardCards(data);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2">
        {primaryCards.map((card, index) => (
          <DashboardSectionCard key={`${card.href}-${card.title}-${index}`} {...card} />
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-500">{t("dashboard.moreTitle")}</h2>
        <div className="flex flex-wrap gap-2">
          {moreLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <span aria-hidden>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
