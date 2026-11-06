"use client";

import DashboardSectionCard from "@/components/dashboard/DashboardSectionCard";
import { useDashboardCards } from "@/hooks/useDashboardCards";
import type { DashboardData } from "@/lib/dashboard";

type DashboardCardsProps = {
  data: DashboardData;
};

export default function DashboardCards({ data }: DashboardCardsProps) {
  const { primaryCards } = useDashboardCards(data);

  return (
    <section className="grid grid-cols-2 gap-2">
      {primaryCards.map((card, index) => (
        <DashboardSectionCard key={`${card.href}-${card.title}-${index}`} {...card} />
      ))}
    </section>
  );
}
