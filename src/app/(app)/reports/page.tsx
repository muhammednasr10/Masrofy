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
import { FeedbackBanner } from "@/components/wallets/FeedbackBanner";
import { useReportsPage } from "@/hooks/useReportsPage";

const reportLinks = [
  { href: "#cash-flow", label: "التدفق النقدي" },
  { href: "#categories", label: "الفئات" },
  { href: "#wallets-activity", label: "المحافظ" },
  { href: "#plan", label: "الخطة" },
  { href: "#trend", label: "الاتجاه" },
  { href: "#year", label: "السنة" },
  { href: "#wealth", label: "الثروة" },
  { href: "#investments", label: "الاستثمار" },
  { href: "#reconciliation", label: "الجرد" },
];

export default function ReportsPage() {
  const {
    loading,
    error,
    currency,
    planMonthKey,
    setPlanMonthKey,
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

  if (loading) {
    return <p className="text-sm text-slate-500">جاري تحميل التقارير...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-emerald-700">تحليلات مالية</p>
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">التقارير</h1>
        <p className="mt-1 text-sm text-slate-500">
          كل التقارير اللي ممكن تحتاجها في مكان واحد — اختر الشهر واستعرض الملخصات.
        </p>
      </div>

      <PlanMonthPicker
        planMonthKey={planMonthKey}
        monthLabel={monthLabel}
        onChange={setPlanMonthKey}
      />

      <FeedbackBanner error={error} message={null} />

      <nav className="flex gap-2 overflow-x-auto pb-1">
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
          title="ملخص التدفق النقدي"
          description="إجمالي الدخل والمصروفات وصافي الشهر المختار."
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
          title="المصروفات حسب الفئة"
          description="توزيع مصروفات الشهر على الفئات مع النسب."
        >
          <CategoryBreakdownReport summary={monthSummary} currency={currency} />
        </ReportSection>

        <ReportSection
          id="wallets-activity"
          title="حركة المحافظ"
          description="مصروفات ودخل كل محفظة خلال الشهر المختار."
        >
          <WalletActivityReport rows={walletActivity} currency={currency} />
        </ReportSection>

        <ReportSection
          id="plan"
          title="الخطة مقابل الواقع"
          description="مقارنة ما خططت له مع ما تم تسجيله فعليًا."
        >
          <div className="space-y-6">
            <PlanOverviewCards comparison={planComparison} currency={currency} />
            <PlanComparisonTable comparison={planComparison} currency={currency} />
          </div>
        </ReportSection>

        <ReportSection
          id="trend"
          title="اتجاه آخر 6 أشهر"
          description="مقارنة سريعة للدخل والمصروفات على مدار الأشهر الأخيرة."
        >
          <MonthlyTrendReport rows={recentTrend} currency={currency} />
        </ReportSection>

        <ReportSection
          id="year"
          title={`ملخص سنة ${planYear}`}
          description="جدول شهري بإجماليات السنة الحالية."
        >
          <YearlyOverviewReport overview={yearlyOverview} currency={currency} />
        </ReportSection>

        <ReportSection
          id="wealth"
          title="الثروة والمحافظ"
          description="صافي ثروتك الحالي وتفاصيل أرصدة المحافظ."
        >
          <div className="space-y-6">
            <WalletsSummaryCard summary={portfolioSummary} currency={currency} />
            <WalletBalancesReport balances={walletBalances.balances} currency={currency} />
          </div>
        </ReportSection>

        <ReportSection
          id="investments"
          title="ملخص الاستثمارات"
          description="قيمة المحفظة الاستثمارية والأرباح/الخسائر لكل استثمار."
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
          title="سجل الجرد"
          description="تاريخ مقارنة الأرصدة المسجّلة بالواقع."
        >
          <WalletReconciliationHistory reconciliations={reconciliations} currency={currency} />
        </ReportSection>
      </div>
    </div>
  );
}
