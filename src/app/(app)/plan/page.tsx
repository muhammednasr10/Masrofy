"use client";

import { useState } from "react";
import FullPlanPanel from "@/components/plan/FullPlanPanel";
import PlanHorizonOverview from "@/components/plan/PlanHorizonOverview";
import PlanHorizonSandbox from "@/components/plan/PlanHorizonSandbox";
import PlanMonthPanel from "@/components/plan/PlanMonthPanel";
import PlanOverviewCards from "@/components/plan/PlanOverviewCards";
import PlanWealthForecast from "@/components/plan/PlanWealthForecast";
import CategoryFormModal from "@/components/categories/CategoryFormModal";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { getParentCategories } from "@/lib/categories/hierarchy";
import { isExpenseCategory } from "@/lib/categories/flow";
import { filterMonthComparisonExpenseRows } from "@/lib/plan/horizon-visibility";
import { useSearchParams } from "@/lib/router/navigation";
import { usePlanPage } from "@/hooks/usePlanPage";

type PlanTab = "overview" | "accounts" | "month" | "horizon";

const PLAN_TABS: Array<{ id: PlanTab; label: string }> = [
  { id: "month", label: "الشهر الحالي" },
  { id: "horizon", label: "وضع الخطة" },
  { id: "overview", label: "نظرة عامة" },
  { id: "accounts", label: "حسابات" },
];

export default function PlanPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const openCategoryId = searchParams.get("category");
  const {
    loading,
    saving,
    error,
    message,
    currency,
    planYear,
    comparison,
    wealthForecast,
    categories,
    plannedIncome,
    categoryPlans,
    notes,
    horizonLines,
    horizonSaving,
    monthStart,
    monthEnd,
    setPlannedIncome,
    handleCategoryPlanChange,
    setNotes,
    handleSavePlan,
    categoryForm,
    setHorizonLine,
    handleSaveHorizonPlan,
  } = usePlanPage();
  const [planTab, setPlanTab] = useState<PlanTab>("month");

  if (loading) {
    return <p className="text-sm text-slate-500">{t("plan.loading")}</p>;
  }

  const monthExpenseRows = filterMonthComparisonExpenseRows(
    comparison.expenseRows,
    categories,
    horizonLines,
  );
  const monthExpenseParentIds = new Set(monthExpenseRows.map((row) => row.categoryId));
  const plannedIncomeAmount = Number(plannedIncome) || 0;
  const allocatedExpenses = getParentCategories(categories)
    .filter(
      (category) =>
        isExpenseCategory(category) && monthExpenseParentIds.has(category.id),
    )
    .reduce((total, category) => total + (Number(categoryPlans[category.id]) || 0), 0);
  const remainingIncome = plannedIncomeAmount - allocatedExpenses;

  const overviewProps = {
    currency,
    categories,
    lines: horizonLines,
    plannedMonthlyIncome: plannedIncomeAmount,
    initialRangeStart: monthStart,
    currentMonthStart: monthStart,
    actualMonthIncome: comparison.income.actual,
    actualMonthExpense: comparison.expenses.actual,
  };

  return (
    <div className="space-y-6">
      <FeedbackBanner error={error} message={message} />

      <PlanOverviewCards comparison={comparison} currency={currency} />

      <PlanWealthForecast
        monthStart={wealthForecast.monthStart}
        expectedMonthEnd={wealthForecast.expectedMonthEnd}
        expectedYearEnd={wealthForecast.expectedYearEnd}
        monthsLeftInYear={wealthForecast.monthsLeftInYear}
        planYear={planYear}
        yearForecastSource={wealthForecast.yearForecastSource}
        currency={currency}
      />

      <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {PLAN_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPlanTab(tab.id)}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                planTab === tab.id
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {planTab === "overview" ? (
          <div className="mt-6">
            <PlanHorizonOverview {...overviewProps} />
          </div>
        ) : null}

        {planTab === "accounts" ? (
          <div className="mt-6">
            <PlanHorizonSandbox {...overviewProps} />
          </div>
        ) : null}

        {planTab === "horizon" ? (
          <div className="mt-6">
            <FullPlanPanel
              currency={currency}
              categories={categories}
              lines={horizonLines}
              saving={horizonSaving}
              monthStart={monthStart}
              monthEnd={monthEnd}
              onLineChange={setHorizonLine}
              onAddCategory={() => categoryForm.openForm()}
              onSave={handleSaveHorizonPlan}
            />
          </div>
        ) : null}

        {planTab === "month" ? (
          <PlanMonthPanel
            currency={currency}
            comparison={comparison}
            incomeRows={comparison.incomeRows}
            expenseRows={monthExpenseRows}
            plannedIncome={plannedIncome}
            categoryPlans={categoryPlans}
            notes={notes}
            saving={saving}
            allocatedExpenses={allocatedExpenses}
            remainingIncome={remainingIncome}
            openCategoryId={openCategoryId}
            onPlannedIncomeChange={setPlannedIncome}
            onCategoryPlanChange={handleCategoryPlanChange}
            onNotesChange={setNotes}
            onAddCategory={() => categoryForm.openForm()}
            onSave={handleSavePlan}
          />
        ) : null}
      </section>

      {categoryForm.form ? (
        <CategoryFormModal
          form={categoryForm.form}
          categories={categories}
          submitting={categoryForm.submitting}
          error={categoryForm.error}
          onChange={categoryForm.setForm}
          onSubmit={categoryForm.handleSubmit}
          onClose={categoryForm.closeForm}
        />
      ) : null}
    </div>
  );
}
