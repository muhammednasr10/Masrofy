"use client";

import CategoryBreakdownReport from "@/components/reports/CategoryBreakdownReport";
import InvestmentSnapshotReport from "@/components/reports/InvestmentSnapshotReport";
import MonthlyTrendReport from "@/components/reports/MonthlyTrendReport";
import ReportSection from "@/components/reports/ReportSection";
import WalletActivityReport from "@/components/reports/WalletActivityReport";
import WalletBalancesReport from "@/components/reports/WalletBalancesReport";
import YearlyOverviewReport from "@/components/reports/YearlyOverviewReport";
import ExpensesSummaryCard from "@/components/expenses/ExpensesSummaryCard";
import PlanComparisonTable from "@/components/plan/PlanComparisonTable";
import PlanMonthPicker from "@/components/plan/PlanMonthPicker";
import PlanOverviewCards from "@/components/plan/PlanOverviewCards";
import InvestmentsSummaryCard from "@/components/investments/InvestmentsSummaryCard";
import WalletReconciliationHistory from "@/components/wallets/WalletReconciliationHistory";
import WalletsSummaryCard from "@/components/wallets/WalletsSummaryCard";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useReportsPage } from "@/hooks/useReportsPage";

export default function ReportsPage() {
  const t = useTranslations();
  const {
    loading,
    error,
    currency,
    planMonthKey,
    setPlanMonthKey,
    monthStartDay,
    monthLabel,
    planYear,
    monthSummary,
    walletActivity,
    planComparison,
    recentTrend,
    yearlyOverview,
    portfolioSummary,
    walletBalances,
    investmentSummary,
    profitEntriesTotal,
    reconciliations,
  } = useReportsPage();

  const reportLinks = [
    { href: "#cash-flow", label: t("reports.navCashFlow") },
    { href: "#categories", label: t("reports.navCategories") },
    { href: "#wallets-activity", label: t("reports.navWallets") },
    { href: "#plan", label: t("reports.navPlan") },
    { href: "#trend", label: t("reports.navTrend") },
    { href: "#year", label: t("reports.navYear") },
    { href: "#wealth", label: t("reports.navWealth") },
    { href: "#investments", label: t("reports.navInvestments") },
    { href: "#reconciliation", label: t("reports.navReconciliation") },
  ];

  if (loading) {
    return <p className="text-sm text-slate-500">{t("reports.loading")}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-emerald-700">{t("reports.eyebrow")}</p>
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{t("reports.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("reports.subtitle")}</p>
      </div>

      <PlanMonthPicker
        planMonthKey={planMonthKey}
        monthLabel={monthLabel}
        monthStartDay={monthStartDay}
        onChange={setPlanMonthKey}
      />

      <FeedbackBanner error={error} message={null} />

      <nav className="x-scroll flex max-w-full gap-2 pb-1">
        {reportLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div className="space-y-6">
        <ReportSection
          id="cash-flow"
          title={t("reports.cashFlowTitle")}
          description={t("reports.cashFlowDesc")}
        >
          <ExpensesSummaryCard
            monthLabel={monthLabel}
            totalExpenses={monthSummary.totalExpenses}
            totalIncome={monthSummary.totalIncome}
            balance={monthSummary.balance}
            currency={currency}
          />
        </ReportSection>

        <ReportSection
          id="categories"
          title={t("reports.categoriesTitle")}
          description={t("reports.categoriesDesc")}
        >
          <CategoryBreakdownReport summary={monthSummary} currency={currency} />
        </ReportSection>

        <ReportSection
          id="wallets-activity"
          title={t("reports.walletsTitle")}
          description={t("reports.walletsDesc")}
        >
          <WalletActivityReport rows={walletActivity} currency={currency} />
        </ReportSection>

        <ReportSection
          id="plan"
          title={t("reports.planTitle")}
          description={t("reports.planDesc")}
        >
          <div className="space-y-6">
            <PlanOverviewCards comparison={planComparison} currency={currency} />
            <PlanComparisonTable comparison={planComparison} currency={currency} />
          </div>
        </ReportSection>

        <ReportSection
          id="trend"
          title={t("reports.trendTitle")}
          description={t("reports.trendDesc")}
        >
          <MonthlyTrendReport rows={recentTrend} currency={currency} />
        </ReportSection>

        <ReportSection
          id="year"
          title={t("reports.yearTitle", { year: String(planYear) })}
          description={t("reports.yearDesc")}
        >
          <YearlyOverviewReport overview={yearlyOverview} currency={currency} />
        </ReportSection>

        <ReportSection
          id="wealth"
          title={t("reports.wealthTitle")}
          description={t("reports.wealthDesc")}
        >
          <div className="space-y-6">
            <WalletsSummaryCard summary={portfolioSummary} currency={currency} />
            <WalletBalancesReport balances={walletBalances.balances} currency={currency} />
          </div>
        </ReportSection>

        <ReportSection
          id="investments"
          title={t("reports.investmentsTitle")}
          description={t("reports.investmentsDesc")}
        >
          <div className="space-y-6">
            <InvestmentsSummaryCard
              totalCostBasis={investmentSummary.totalCostBasis}
              totalCurrentValue={investmentSummary.totalCurrentValue}
              totalProfit={investmentSummary.totalProfit}
              totalReturnPercent={investmentSummary.totalReturnPercent}
              currency={currency}
            />
            <InvestmentSnapshotReport
              summary={investmentSummary}
              currency={currency}
              profitEntriesTotal={profitEntriesTotal}
            />
          </div>
        </ReportSection>

        <ReportSection
          id="reconciliation"
          title={t("reports.reconciliationTitle")}
          description={t("reports.reconciliationDesc")}
        >
          <WalletReconciliationHistory reconciliations={reconciliations} currency={currency} />
        </ReportSection>
      </div>
    </div>
  );
}
