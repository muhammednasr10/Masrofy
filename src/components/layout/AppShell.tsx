"use client";

import { type ReactNode } from "react";
import { AlertsProvider } from "@/components/alerts/AlertsProvider";
import { DashboardBalanceVisibilityProvider } from "@/components/dashboard/DashboardBalanceVisibility";
import { useLocale } from "@/components/i18n/LocaleProvider";
import AppQuickActions from "@/components/layout/AppQuickActions";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { useDailySpendReminder } from "@/hooks/useDailySpendReminder";

export default function AppShell({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  useDailySpendReminder(locale);

  return (
    <DashboardBalanceVisibilityProvider>
      <AlertsProvider>
        {children}
        <AppQuickActions />
        <MobileBottomNav />
      </AlertsProvider>
    </DashboardBalanceVisibilityProvider>
  );
}
