"use client";

import DashboardAddExpenseButton from "@/components/dashboard/DashboardAddExpenseButton";
import { DashboardBalanceToggleButton } from "@/components/dashboard/DashboardBalanceVisibility";

export default function AppQuickActions() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 safe-bottom sm:bottom-6">
      <div className="mx-auto flex w-full max-w-5xl justify-end px-3 sm:px-4">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-emerald-100 bg-white/95 p-1.5 shadow-lg backdrop-blur sm:rounded-2xl sm:p-2">
          <DashboardBalanceToggleButton />
          <DashboardAddExpenseButton />
        </div>
      </div>
    </div>
  );
}
