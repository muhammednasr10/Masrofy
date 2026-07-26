"use client";

import PlanEditor from "@/components/plan/PlanEditor";
import ModalShell from "@/components/ui/ModalShell";
import type { Category } from "@/lib/types/database";

type AnnualPlanModalProps = {
  year: number;
  plannedIncome: string;
  categoryPlans: Record<string, string>;
  categories: Category[];
  notes: string;
  saving: boolean;
  applying: boolean;
  error: string | null;
  hasSavedTemplate: boolean;
  onPlannedIncomeChange: (value: string) => void;
  onCategoryPlanChange: (categoryId: string, value: string) => void;
  onNotesChange: (value: string) => void;
  onSaveTemplate: () => void;
  onApplyToYear: () => void;
  onApplyToCurrentMonth: () => void;
  onClose: () => void;
};

export default function AnnualPlanModal({
  year,
  plannedIncome,
  categoryPlans,
  categories,
  notes,
  saving,
  applying,
  error,
  hasSavedTemplate,
  onPlannedIncomeChange,
  onCategoryPlanChange,
  onNotesChange,
  onSaveTemplate,
  onApplyToYear,
  onApplyToCurrentMonth,
  onClose,
}: AnnualPlanModalProps) {
  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              الخطة الافتراضية لسنة {year}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              حدّد الدخل والمصروفات المتكررة كل شهر. طبّقها على السنة كلها، وبعدها عدّل
              أي شهر لوحدك.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-slate-500 transition hover:bg-slate-100"
          >
            إغلاق
          </button>
        </div>

        <div className="mt-6">
          <PlanEditor
            plannedIncome={plannedIncome}
            categoryPlans={categoryPlans}
            categories={categories}
            notes={notes}
            saving={false}
            onPlannedIncomeChange={onPlannedIncomeChange}
            onCategoryPlanChange={onCategoryPlanChange}
            onNotesChange={onNotesChange}
            onSubmit={() => {}}
            onAddCategory={() => {}}
            hideCategoryAddButton
            hideSaveButton
            incomeLabel="الدخل الشهري الافتراضي"
            notesPlaceholder="مثال: ملاحظات عامة تنطبق على معظم شهور السنة..."
          />
        </div>

        {error ? (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onSaveTemplate}
            disabled={saving || applying}
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {saving ? "جاري الحفظ..." : hasSavedTemplate ? "تحديث القالب" : "حفظ القالب"}
          </button>
          <button
            type="button"
            onClick={onApplyToCurrentMonth}
            disabled={saving || applying}
            className="flex-1 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
          >
            تطبيق على الشهر الحالي
          </button>
          <button
            type="button"
            onClick={onApplyToYear}
            disabled={saving || applying}
            className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {applying ? "جاري التطبيق..." : "تطبيق على كل السنة"}
          </button>
        </div>
    </ModalShell>
  );
}
