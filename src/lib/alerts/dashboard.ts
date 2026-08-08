import {
  getCollectionStatus,
  getDaysUntilCollection,
} from "@/lib/investments/utils";
import type { Translator } from "@/i18n/translate";
import type { PlanComparison } from "@/lib/types/database";
import type { Investment, Wallet, WalletReconciliation } from "@/lib/types/database";
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
  actionLabel: string;
  href: string;
};

export function buildDashboardAlerts({
  planComparison,
  investments,
  wallets,
  reconciliations,
  formatAmount,
  staleReconciliationDays = 30,
  upcomingCollectionDays = 7,
  t,
}: {
  planComparison: PlanComparison;
  investments: Investment[];
  wallets: Wallet[];
  reconciliations: WalletReconciliation[];
  formatAmount: (value: number) => string;
  staleReconciliationDays?: number;
  upcomingCollectionDays?: number;
  t: Translator;
}): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  if (planComparison.hasPlan && planComparison.expenses.difference > 0) {
    alerts.push({
      id: "plan-over-budget",
      tone: "red",
      icon: "📋",
      title: t("alertItems.planOverBudgetTitle"),
      description: t("alertItems.planOverBudgetDesc", {
        amount: formatAmount(planComparison.expenses.difference),
      }),
      actionLabel: t("alertItems.planOverBudgetAction"),
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
          ? t("alertItems.investmentDueTodayTitle", { name: investment.name })
          : status === "overdue"
            ? t("alertItems.investmentOverdueTitle", { name: investment.name })
            : t("alertItems.investmentDueSoonTitle", { name: investment.name }),
      description:
        days != null && days > 0
          ? t("alertItems.investmentDueSoonDesc", {
              days: String(days),
              amount: formatAmount(Number(investment.cost_basis)),
            })
          : `${investment.icon} ${investment.name}`,
      actionLabel: t("alertItems.investmentAction"),
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
      icon: "🔄",
      title: t("alertItems.walletReconcileTitle"),
      description:
        walletsNeedingReconciliation.length === 1
          ? t("alertItems.walletReconcileSingleDesc", { name: names })
          : t("alertItems.walletReconcileMultiDesc", {
              count: String(walletsNeedingReconciliation.length),
              names: `${names}${walletsNeedingReconciliation.length > 2 ? "..." : ""}`,
            }),
      actionLabel: t("alertItems.walletReconcileAction"),
      href: "/wallets",
    });
  }

  return alerts;
}
