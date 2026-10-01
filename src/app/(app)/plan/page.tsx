"use client";

import { useState } from "react";
import FullPlanPanel from "@/components/plan/FullPlanPanel";
import PlanComparisonTable from "@/components/plan/PlanComparisonTable";
import PlanOverviewCards from "@/components/plan/PlanOverviewCards";
import PlanWealthForecast from "@/components/plan/PlanWealthForecast";
import CategoryFormModal from "@/components/categories/CategoryFormModal";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { getParentCategories } from "@/lib/categories/hierarchy";
import { formatCurrency } from "@/lib/utils/format";
import { useSearchParams } from "@/lib/router/navigation";
import { usePlanPage } from "@/hooks/usePlanPage";

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
  const [planTab, setPlanTab] = useState<"month" | "horizon">("month");

  if (loading) {
    return <p className="text-sm text-slate-500">{t("plan.loading")}</p>;
  }

  const parentCategories = getParentCategories(categories);
  const plannedIncomeAmount = Number(plannedIncome) || 0;
  const allocatedExpenses = parentCategories.reduce(
    (total, category) => total + (Number(categoryPlans[category.id]) || 0),
    0,
  );
  const remainingIncome = plannedIncomeAmount - allocatedExpenses;

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
          <button
            type="button"
            onClick={() => setPlanTab("month")}
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
              planTab === "month"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            الشهر الحالي
          </button>
          <button
            type="button"
            onClick={() => setPlanTab("horizon")}
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
              planTab === "horizon"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            الخطة الكاملة
          </button>
        </div>

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
        ) : (
          <>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">مقارنة الواقع بالخطة</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          عدّل المبلغ المخطط في جدول الدخل وجدول المصروفات، ثم احفظ الخطة.
        </p>

        <form
          className="mt-6 space-y-8"
          onSubmit={(event) => {
            event.preventDefault();
            handleSavePlan();
          }}
        >
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">الدخل</h3>
            <PlanComparisonTable
              comparison={comparison}
              currency={currency}
              rows={comparison.incomeRows}
              earnTone
              categoryPlans={{ income: plannedIncome }}
              onCategoryPlanChange={(_categoryId, value) => setPlannedIncome(value)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">المصروفات</h3>
              <button
                type="button"
                onClick={() => categoryForm.openForm()}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
              >
                + إضافة فئة
              </button>
            </div>
            <PlanComparisonTable
              comparison={comparison}
              currency={currency}
              initialOpenCategoryId={openCategoryId}
              categoryPlans={categoryPlans}
              onCategoryPlanChange={handleCategoryPlanChange}
            />
          </div>

          {parentCategories.length > 0 ? (
            <div className="space-y-1 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
              <p className="text-slate-600">
                مجموع الفئات{" "}
                <span className="font-semibold text-slate-900">
                  {formatCurrency(allocatedExpenses, currency)}
                </span>
              </p>
              <p className={remainingIncome < 0 ? "font-medium text-red-600" : "font-medium text-emerald-700"}>
                المتبقي من الدخل {formatCurrency(remainingIncome, currency)}
              </p>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              مفيش فئات لسه. اضغط «إضافة فئة» للبدء.
            </p>
          )}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">ملاحظات على الخطة</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="مثال: الشهر ده فيه مصاريف مدرسة وزيادة فواتير..."
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? "جاري الحفظ..." : "حفظ الخطة"}
          </button>
        </form>
          </>
        )}
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
