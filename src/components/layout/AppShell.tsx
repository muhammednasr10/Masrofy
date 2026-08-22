"use client";

import { type ReactNode } from "react";
import { DashboardBalanceVisibilityProvider } from "@/components/dashboard/DashboardBalanceVisibility";
import AppQuickActions from "@/components/layout/AppQuickActions";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <DashboardBalanceVisibilityProvider>
      {children}
      <AppQuickActions />
      <MobileBottomNav />
    </DashboardBalanceVisibilityProvider>
  );
}
