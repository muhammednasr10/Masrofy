"use client";

import DashboardSectionCard from "@/components/dashboard/DashboardSectionCard";
import { useDashboardCards } from "@/hooks/useDashboardCards";
import type { DashboardData } from "@/lib/dashboard";

type DashboardCardsProps = {
  data: DashboardData;
};

export default function DashboardCards({ data }: DashboardCardsProps) {
  const cards = useDashboardCards(data);

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card, index) => (
        <DashboardSectionCard key={`${card.href}-${card.title}-${index}`} {...card} />
      ))}
    </section>
  );
}
