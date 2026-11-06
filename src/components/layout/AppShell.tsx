"use client";

import { type ReactNode } from "react";
import { DashboardBalanceVisibilityProvider } from "@/components/dashboard/DashboardBalanceVisibility";
import { useLocale } from "@/components/i18n/LocaleProvider";
import AppQuickActions from "@/components/layout/AppQuickActions";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import PlanDuePrompt from "@/components/plan/PlanDuePrompt";
import { useDailySpendReminder } from "@/hooks/useDailySpendReminder";

export default function AppShell({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  useDailySpendReminder(locale);

  return (
    <DashboardBalanceVisibilityProvider>
      {children}
      <PlanDuePrompt />
      <AppQuickActions />
      <MobileBottomNav />
    </DashboardBalanceVisibilityProvider>
  );
}
