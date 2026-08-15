"use client";

import AnnualPlanModal from "@/components/plan/AnnualPlanModal";
import PlanComparisonTable from "@/components/plan/PlanComparisonTable";
import PlanEditor from "@/components/plan/PlanEditor";
import PlanMonthPicker from "@/components/plan/PlanMonthPicker";
import PlanOverviewCards from "@/components/plan/PlanOverviewCards";
import CategoryFormModal from "@/components/categories/CategoryFormModal";
import { FeedbackBanner } from "@/components/wallets/FeedbackBanner";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { usePlanPage } from "@/hooks/usePlanPage";

export default function PlanPage() {
  const t = useTranslations();
  const {
    loading,
    saving,
    error,
    message,
    currency,
    planMonthKey,
    planYear,
    comparison,
    categories,
    plannedIncome,
    categoryPlans,
    notes,
    annualModalOpen,
    annualPlannedIncome,
    annualCategoryPlans,
    annualNotes,
    annualSaving,
    annualApplying,
    annualError,
    hasAnnualTemplate,
    monthStartDay,
    setPlanMonthKey,
    setPlannedIncome,
    handleCategoryPlanChange,
    setNotes,
    handleSavePlan,
    categoryForm,
    openAnnualModal,
    closeAnnualModal,
    setAnnualPlannedIncome,
    handleAnnualCategoryPlanChange,
    setAnnualNotes,
    handleSaveAnnualTemplate,
    handleApplyAnnualToCurrentMonth,
    handleApplyAnnualToYear,
  } = usePlanPage();

  if (loading) {
    return <p className="text-sm text-slate-500">{t("plan.loading")}</p>;
  }

  return (
    <div className="space-y-6">
      <PlanMonthPicker
        planMonthKey={planMonthKey}
        monthLabel={comparison.monthLabel}
        monthStartDay={monthStartDay}
        onChange={setPlanMonthKey}
        onOpenAnnualPlan={openAnnualModal}
        planYear={planYear}
        hasAnnualTemplate={hasAnnualTemplate}
      />

      <FeedbackBanner error={error} message={message} />

      <PlanOverviewCards comparison={comparison} currency={currency} />

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">رسم الخطة</h2>
          <p className="mt-1 text-sm text-slate-500">
            {hasAnnualTemplate
              ? "الشهر ده بيستخدم الخطة الافتراضية لحد ما تحفظ تعديلاتك."
              : "حدّد دخلك المتوقع وميزانية كل فئة للشهر."}
          </p>

          <div className="mt-6">
            <PlanEditor
              plannedIncome={plannedIncome}
              categoryPlans={categoryPlans}
              categories={categories}
              notes={notes}
              saving={saving}
              onPlannedIncomeChange={setPlannedIncome}
              onCategoryPlanChange={handleCategoryPlanChange}
              onNotesChange={setNotes}
              onSubmit={handleSavePlan}
              onAddCategory={() => categoryForm.openForm()}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">مقارنة الواقع بالخطة</h2>
          <p className="mt-1 text-sm text-slate-500">
            {comparison.hasPlan
              ? "المقارنة بين ما خططت له وما تم تسجيله فعليًا هذا الشهر."
              : hasAnnualTemplate
                ? "الشهر ده لسه مفيش خطة محفوظة — القيم الافتراضية ظاهرة للتعديل."
                : "لسه مفيش خطة محفوظة للشهر ده — ارسمها من الجانب ثم احفظ."}
          </p>

          <div className="mt-6">
            <PlanComparisonTable comparison={comparison} currency={currency} />
          </div>
        </section>
      </div>

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

      {annualModalOpen ? (
        <AnnualPlanModal
          year={planYear}
          plannedIncome={annualPlannedIncome}
          categoryPlans={annualCategoryPlans}
          categories={categories}
          notes={annualNotes}
          saving={annualSaving}
          applying={annualApplying}
          error={annualError}
          hasSavedTemplate={hasAnnualTemplate}
          onPlannedIncomeChange={setAnnualPlannedIncome}
          onCategoryPlanChange={handleAnnualCategoryPlanChange}
          onNotesChange={setAnnualNotes}
          onSaveTemplate={handleSaveAnnualTemplate}
          onApplyToYear={handleApplyAnnualToYear}
          onApplyToCurrentMonth={handleApplyAnnualToCurrentMonth}
          onClose={closeAnnualModal}
        />
      ) : null}
    </div>
  );
}
