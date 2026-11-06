import { useMemo } from "react";
import { useDashboardBalanceVisibility } from "@/components/dashboard/DashboardBalanceVisibility";
import type { DashboardSectionCardProps } from "@/components/dashboard/DashboardSectionCard";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useFormat } from "@/hooks/useFormat";
import type { DashboardData } from "@/lib/dashboard";
import { MORE_NAV_LINKS } from "@/lib/navigation/links";

export type DashboardMoreLink = {
  href: string;
  icon: string;
  label: string;
};

export function useDashboardCards(data: DashboardData): {
  planCards: DashboardSectionCardProps[];
  flowCards: DashboardSectionCardProps[];
  walletCard: DashboardSectionCardProps;
  moreLinks: DashboardMoreLink[];
} {
  const t = useTranslations();
  const { formatCurrency } = useFormat();
  const { maskBalance } = useDashboardBalanceVisibility();

  return useMemo(() => {
    const formatAmount = (value: number) => formatCurrency(value, data.currency);

    const planComparison = data.planComparison;
    const planValue = (planned: number) =>
      planComparison.hasPlan ? formatAmount(planned) : t("dashboard.planNoPlanValue");

    const planCards: DashboardSectionCardProps[] = [
      {
        href: "/plan",
        icon: "💰",
        title: t("dashboard.planIncomeTitle"),
        description: t("dashboard.planDesc"),
        primaryValue: planValue(planComparison.income.planned),
        tone: "emerald",
      },
      {
        href: "/plan",
        icon: "📋",
        title: t("dashboard.planExpensesTitle"),
        description: t("dashboard.planDesc"),
        primaryValue: planValue(planComparison.expenses.planned),
        tone: "amber",
      },
    ];

    const flowCards: DashboardSectionCardProps[] = [
      {
        href: "/expenses",
        icon: "💸",
        title: t("dashboard.expensesTitle"),
        description: t("dashboard.expensesDesc"),
        primaryValue: maskBalance(formatAmount(data.summary.totalExpenses)),
        secondaryValue:
          data.dueRecurringCount > 0
            ? t("dashboard.expensesRecurringDue", { count: String(data.dueRecurringCount) })
            : undefined,
        tone: "red",
      },
      {
        href: "/expenses",
        icon: "💵",
        title: t("dashboard.incomeTitle"),
        description: t("dashboard.netMonthDesc"),
        primaryValue: maskBalance(formatAmount(data.summary.totalIncome)),
        tone: "emerald",
      },
      {
        href: "/expenses",
        icon: "📊",
        title: t("dashboard.netMonthTitle"),
        description: t("dashboard.netMonthDesc"),
        primaryValue: maskBalance(formatAmount(data.summary.balance)),
        tone: "sky",
      },
    ];

    const walletCard: DashboardSectionCardProps = {
      href: "/wallets",
      icon: "👛",
      title: t("dashboard.walletsTitle"),
      description: t("dashboard.walletsDesc"),
      primaryValue: maskBalance(formatAmount(data.portfolio.assetTotal)),
      tone: "emerald",
    };

    const moreLinks: DashboardMoreLink[] = MORE_NAV_LINKS.map((link) => ({
      href: link.href,
      icon: link.icon,
      label: t(link.key),
    }));

    return { planCards, flowCards, walletCard, moreLinks };
  }, [data, formatCurrency, maskBalance, t]);
}
