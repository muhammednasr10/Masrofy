import { useMemo } from "react";
import { useDashboardBalanceVisibility } from "@/components/dashboard/DashboardBalanceVisibility";
import type { DashboardSectionCardProps } from "@/components/dashboard/DashboardSectionCard";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useFormat } from "@/hooks/useFormat";
import type { DashboardData } from "@/lib/dashboard";
import { getDashboardPlanStatus } from "@/lib/dashboard/plan-status";
import { MORE_NAV_LINKS } from "@/lib/navigation/links";

export type DashboardMoreLink = {
  href: string;
  icon: string;
  label: string;
};

export function useDashboardCards(data: DashboardData): {
  primaryCards: DashboardSectionCardProps[];
  moreLinks: DashboardMoreLink[];
} {
  const t = useTranslations();
  const { formatCurrency } = useFormat();
  const { maskBalance } = useDashboardBalanceVisibility();

  return useMemo(() => {
    const formatAmount = (value: number) => formatCurrency(value, data.currency);

    const netMonthSecondary = t("dashboard.netMonthLine", {
      income: formatAmount(data.summary.totalIncome),
      expenses: formatAmount(data.summary.totalExpenses),
    });

    const planComparison = data.planComparison;
    const planRemaining = planComparison.expenses.planned - planComparison.expenses.actual;
    const planHasBudget = planComparison.hasPlan && planComparison.expenses.planned > 0;
    const planStatus = getDashboardPlanStatus(planComparison, formatAmount, t);

    const primaryCards: DashboardSectionCardProps[] = [
      {
        href: "/expenses",
        icon: "💸",
        title: t("dashboard.expensesTitle"),
        description: t("dashboard.expensesDesc"),
        primaryValue: maskBalance(formatAmount(data.summary.totalExpenses)),
        secondaryValue:
          data.dueRecurringCount > 0
            ? t("dashboard.expensesRecurringDue", { count: String(data.dueRecurringCount) })
            : t("dashboard.expensesThisMonth", { count: String(data.transactionCount) }),
        tone: "red",
      },
      {
        href: "/wallets",
        icon: "👛",
        title: t("dashboard.walletsTitle"),
        description: t("dashboard.walletsDesc"),
        primaryValue: maskBalance(formatAmount(data.portfolio.assetTotal)),
        secondaryValue: t("dashboard.walletsSecondary", { count: String(data.walletCount) }),
        tone: "emerald",
      },
      {
        href: "/plan",
        icon: "📋",
        title: t("dashboard.planTitle"),
        description: t("dashboard.planDesc"),
        primaryValue: planHasBudget
          ? formatAmount(Math.abs(planRemaining))
          : t("dashboard.planNoPlanValue"),
        secondaryValue: planHasBudget
          ? planRemaining < 0
            ? t("dashboard.planOverValue")
            : t("dashboard.planRemainingValue")
          : planStatus,
        tone: "amber",
      },
      {
        href: "/expenses",
        icon: "📊",
        title: t("dashboard.netMonthTitle"),
        description: t("dashboard.netMonthDesc"),
        primaryValue: maskBalance(formatAmount(data.summary.balance)),
        secondaryValue: maskBalance(netMonthSecondary),
        tone: "sky",
      },
    ];

    const moreLinks: DashboardMoreLink[] = MORE_NAV_LINKS.map((link) => ({
      href: link.href,
      icon: link.icon,
      label: t(link.key),
    }));

    return { primaryCards, moreLinks };
  }, [data, formatCurrency, maskBalance, t]);
}
