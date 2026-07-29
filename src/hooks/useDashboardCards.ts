import { useMemo } from "react";
import { useDashboardBalanceVisibility } from "@/components/dashboard/DashboardBalanceVisibility";
import type { DashboardSectionCardProps } from "@/components/dashboard/DashboardSectionCard";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useFormat } from "@/hooks/useFormat";
import type { DashboardData } from "@/lib/dashboard";
import { getDashboardPlanStatus } from "@/lib/dashboard/plan-status";

type DashboardCardConfig = DashboardSectionCardProps;

export function useDashboardCards(data: DashboardData): DashboardCardConfig[] {
  const t = useTranslations();
  const { formatCurrency } = useFormat();
  const { maskBalance } = useDashboardBalanceVisibility();

  return useMemo(() => {
    const formatAmount = (value: number) => formatCurrency(value, data.currency);

    const netMonthSecondary = t("dashboard.netMonthLine", {
      income: formatAmount(data.summary.totalIncome),
      expenses: formatAmount(data.summary.totalExpenses),
    });

    const investmentProfit =
      (data.investmentSummary.totalProfit >= 0 ? "+" : "") +
      formatAmount(data.investmentSummary.totalProfit);

    const investmentSecondary =
      data.investmentCount > 0
        ? t("dashboard.investmentsCount", {
            count: String(data.investmentCount),
            profit: investmentProfit,
          })
        : t("dashboard.investmentsEmpty");

    const savingsSecondary =
      data.savingsSummary.activeCount > 0
        ? t("dashboard.savingsActive", {
            count: String(data.savingsSummary.activeCount),
            progress: String(data.savingsSummary.overallProgress),
          })
        : t("dashboard.savingsEmpty");

    const planStatus = getDashboardPlanStatus(data.planComparison, formatAmount, t);

    return [
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
        href: "/expenses",
        icon: "📊",
        title: t("dashboard.netMonthTitle"),
        description: t("dashboard.netMonthDesc"),
        primaryValue: maskBalance(formatAmount(data.summary.balance)),
        secondaryValue: maskBalance(netMonthSecondary),
        tone: "sky",
      },
      {
        href: "/plan",
        icon: "📋",
        title: t("dashboard.planTitle"),
        description: t("dashboard.planDesc"),
        className: "hidden md:block",
        primaryValue: data.planComparison.hasPlan
          ? maskBalance(formatAmount(data.planComparison.expenses.actual))
          : t("dashboard.planNoPlanValue"),
        secondaryValue: planStatus,
        tone: "amber",
      },
      {
        href: "/investments",
        icon: "📈",
        title: t("dashboard.investmentsTitle"),
        description: t("dashboard.investmentsDesc"),
        className: "hidden md:block",
        primaryValue: maskBalance(formatAmount(data.investmentSummary.totalCurrentValue)),
        secondaryValue: maskBalance(investmentSecondary, data.investmentCount > 0),
        tone: "indigo",
      },
      {
        href: "/reports",
        icon: "📊",
        title: t("dashboard.reportsTitle"),
        description: t("dashboard.reportsDesc"),
        className: "hidden md:block",
        primaryValue: maskBalance(formatAmount(data.summary.balance)),
        secondaryValue: data.topCategory
          ? t("dashboard.reportsTopCategory", {
              icon: data.topCategory.icon,
              name: data.topCategory.name,
            })
          : t("dashboard.reportsReady"),
        tone: "sky",
      },
      {
        href: "/categories",
        icon: "🏷️",
        title: t("dashboard.categoriesTitle"),
        description: t("dashboard.categoriesDesc"),
        className: "hidden md:block",
        primaryValue: t("dashboard.categoriesCount", { count: String(data.categoryCount) }),
        secondaryValue: data.topCategory
          ? t("dashboard.categoriesTopMonth", {
              icon: data.topCategory.icon,
              name: data.topCategory.name,
            })
          : t("dashboard.categoriesEmpty"),
        tone: "slate",
      },
      {
        href: "/friends",
        icon: "👥",
        title: t("dashboard.friendsTitle"),
        description: t("dashboard.friendsDesc"),
        className: "hidden md:block",
        primaryValue: t("dashboard.friendsCount", { count: String(data.acceptedFriends) }),
        secondaryValue:
          data.acceptedFriends > 0 ? t("dashboard.friendsActive") : t("dashboard.friendsEmpty"),
        tone: "emerald",
      },
      {
        href: "/savings",
        icon: "🎯",
        title: t("dashboard.savingsTitle"),
        description: t("dashboard.savingsDesc"),
        className: "hidden md:block",
        primaryValue: maskBalance(formatAmount(data.savingsSummary.totalSaved)),
        secondaryValue: maskBalance(savingsSecondary, data.savingsSummary.activeCount > 0),
        tone: "emerald",
      },
      {
        href: "/account",
        icon: "⚙️",
        title: t("dashboard.accountTitle"),
        description: t("dashboard.accountDesc"),
        className: "hidden md:block",
        primaryValue: data.profile?.full_name ?? t("dashboard.accountDefault"),
        secondaryValue: t("dashboard.accountCurrency", { currency: data.currency }),
        tone: "slate",
      },
    ];
  }, [data, formatCurrency, maskBalance, t]);
}
