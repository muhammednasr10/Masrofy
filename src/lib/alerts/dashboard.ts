import {
  getCollectionStatus,
  getDaysUntilCollection,
} from "@/lib/investments/utils";
import type { PlanComparison } from "@/lib/types/database";
import type { Investment, Wallet, WalletReconciliation } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils/format";
import {
  getLatestReconciliationsByWallet,
  getReconcilableWallets,
} from "@/lib/wallets/reconciliation";

export type DashboardAlert = {
  id: string;
  tone: "red" | "amber" | "indigo";
  icon: string;
  title: string;
  description: string;
  href: string;
};

export function buildDashboardAlerts({
  planComparison,
  investments,
  wallets,
  reconciliations,
  currency,
  dueRecurringCount = 0,
  staleReconciliationDays = 30,
  upcomingCollectionDays = 7,
}: {
  planComparison: PlanComparison;
  investments: Investment[];
  wallets: Wallet[];
  reconciliations: WalletReconciliation[];
  currency: string;
  dueRecurringCount?: number;
  staleReconciliationDays?: number;
  upcomingCollectionDays?: number;
}): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  if (planComparison.hasPlan && planComparison.expenses.difference > 0) {
    alerts.push({
      id: "plan-over-budget",
      tone: "red",
      icon: "📋",
      title: "تجاوزت خطة الشهر",
      description: `المصروفات الفعلية أعلى من المخطط بـ ${formatCurrency(planComparison.expenses.difference, currency)}`,
      href: "/plan",
    });
  }

  const upcomingCollections = investments.filter((investment) => {
    if (!investment.is_fixed_return || !investment.collection_date) {
      return false;
    }

    const status = getCollectionStatus(investment);
    if (status === "collected") {
      return false;
    }

    const days = getDaysUntilCollection(investment);
    return days != null && days <= upcomingCollectionDays;
  });

  for (const investment of upcomingCollections.slice(0, 3)) {
    const days = getDaysUntilCollection(investment);
    const status = getCollectionStatus(investment);

    alerts.push({
      id: `investment-collection-${investment.id}`,
      tone: status === "overdue" ? "red" : "indigo",
      icon: "📈",
      title:
        status === "due_today"
          ? `ميعاد قبض ${investment.name} اليوم`
          : status === "overdue"
            ? `ميعاد قبض ${investment.name} فات`
            : `ميعاد قبض ${investment.name} قريب`,
      description:
        days != null && days > 0
          ? `بعد ${days} يوم • ${formatCurrency(Number(investment.cost_basis), currency)}`
          : `${investment.icon} ${investment.name}`,
      href: "/investments",
    });
  }

  const reconcilableWallets = getReconcilableWallets(wallets);
  const latestReconciliations = getLatestReconciliationsByWallet(reconciliations);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - staleReconciliationDays);
  const cutoffDate = cutoff.toISOString().slice(0, 10);

  const walletsNeedingReconciliation = reconcilableWallets.filter((wallet) => {
    const last = latestReconciliations.get(wallet.id);

    if (!last) {
      return true;
    }

    return last.reconciled_at.slice(0, 10) < cutoffDate;
  });

  if (walletsNeedingReconciliation.length > 0) {
    const names = walletsNeedingReconciliation
      .slice(0, 2)
      .map((wallet) => wallet.name)
      .join("، ");

    alerts.push({
      id: "wallet-reconciliation",
      tone: "amber",
      icon: "📋",
      title: "محافظ تحتاج جرد",
      description:
        walletsNeedingReconciliation.length === 1
          ? `${names} — لم يُجرَ جرد حديث`
          : `${walletsNeedingReconciliation.length} محافظ • ${names}${
              walletsNeedingReconciliation.length > 2 ? "..." : ""
            }`,
      href: "/wallets",
    });
  }

  if (dueRecurringCount > 0) {
    alerts.push({
      id: "recurring-due",
      tone: "amber",
      icon: "🔁",
      title: "عمليات متكررة مستحقة",
      description: `${dueRecurringCount} عملية جاهزة للتسجيل`,
      href: "/expenses",
    });
  }

  return alerts;
}
