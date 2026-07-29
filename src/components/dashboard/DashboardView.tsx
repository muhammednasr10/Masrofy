"use client";

import DashboardAddExpenseButton from "@/components/dashboard/DashboardAddExpenseButton";
import DashboardCards from "@/components/dashboard/DashboardCards";
import {
  DashboardBalanceToggleButton,
  DashboardBalanceVisibilityProvider,
} from "@/components/dashboard/DashboardBalanceVisibility";
import type { DashboardData } from "@/lib/dashboard";

type DashboardViewProps = {
  monthLabel: string;
  data: DashboardData;
};

export default function DashboardView({ monthLabel, data }: DashboardViewProps) {
  return (
    <DashboardBalanceVisibilityProvider>
      <div className="space-y-6">
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="wrap-text text-xl font-semibold text-slate-900 sm:text-3xl">{monthLabel}</h1>
          <div className="flex shrink-0 items-center justify-end gap-2">
            <DashboardBalanceToggleButton />
            <DashboardAddExpenseButton />
          </div>
        </section>

        <DashboardCards data={data} />
      </div>
    </DashboardBalanceVisibilityProvider>
  );
}
