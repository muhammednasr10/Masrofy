"use client";

import DashboardSectionCard from "@/components/dashboard/DashboardSectionCard";
import { useDashboardCards } from "@/hooks/useDashboardCards";
import type { DashboardData } from "@/lib/dashboard";

type DashboardCardsProps = {
  data: DashboardData;
};

export default function DashboardCards({ data }: DashboardCardsProps) {
  const { planCards, flowCards, walletCard } = useDashboardCards(data);

  return (
    <div className="space-y-2">
      <section className="grid grid-cols-2 gap-2">
        {planCards.map((card) => (
          <DashboardSectionCard key={card.title} {...card} />
        ))}
      </section>
      <section className="grid grid-cols-3 gap-2">
        {flowCards.map((card) => (
          <DashboardSectionCard key={card.title} {...card} />
        ))}
      </section>
      <section className="grid grid-cols-3 gap-2">
        <DashboardSectionCard {...walletCard} />
      </section>
    </div>
  );
}
