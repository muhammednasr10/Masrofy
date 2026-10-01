import {
  getCollectionStatus,
  getDaysUntilCollection,
} from "@/lib/investments/utils";
import type { Translator } from "@/i18n/translate";
import { CATEGORY_BUDGET_WARNING_RATIO } from "@/lib/plan/budget-warning";
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
  pendingCategorySuggestions = 0,
}: {
  planComparison: PlanComparison;
  investments: Investment[];
  wallets: Wallet[];
  reconciliations: WalletReconciliation[];
  formatAmount: (value: number) => string;
  staleReconciliationDays?: number;
  upcomingCollectionDays?: number;
  t: Translator;
  pendingCategorySuggestions?: number;
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

  const categoryBudgetAlerts = planComparison.expenseRows
    .map((row) => {
      if (row.planned <= 0) {
        return null;
      }

      const ratio = row.actual / row.planned;

      if (ratio < CATEGORY_BUDGET_WARNING_RATIO) {
        return null;
      }

      const overBudget = row.actual > row.planned;

      const alert: DashboardAlert = {
        id: `category-budget-${row.categoryId}`,
        tone: overBudget ? "red" : "amber",
        icon: row.icon,
        title: overBudget
          ? t("alertItems.categoryBudgetOverTitle", { name: row.name })
          : t("alertItems.categoryBudgetNearTitle", { name: row.name }),
        description: overBudget
          ? t("alertItems.categoryBudgetOverDesc", {
              amount: formatAmount(row.actual - row.planned),
            })
          : t("alertItems.categoryBudgetNearDesc", {
              percent: String(Math.round(ratio * 100)),
              remaining: formatAmount(row.planned - row.actual),
            }),
        actionLabel: t("alertItems.categoryBudgetAction"),
        href: `/plan?category=${row.categoryId}`,
      };

      return { ratio, alert };
    })
    .filter((item): item is { ratio: number; alert: DashboardAlert } => item !== null)
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 5)
    .map((item) => item.alert);

  alerts.push(...categoryBudgetAlerts);

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

  if (pendingCategorySuggestions > 0) {
    alerts.unshift({
      id: "category-suggestions",
      tone: "indigo",
      icon: "🏷️",
      title: t("alertItems.categorySuggestionTitle"),
      description: t("alertItems.categorySuggestionDesc", {
        count: String(pendingCategorySuggestions),
      }),
      actionLabel: t("alertItems.categorySuggestionAction"),
      href: "/admin/settings",
    });
  }

  return alerts;
}
