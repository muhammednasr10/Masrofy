"use client";

import PlanComparisonTable from "@/components/plan/PlanComparisonTable";
import { formatCurrency } from "@/lib/utils/format";
import type { PlanComparison } from "@/lib/types/database";

export default function PlanMonthPanel({
  currency,
  comparison,
  incomeRows,
  expenseRows,
  plannedIncome,
  categoryPlans,
  notes,
  saving,
  allocatedExpenses,
  remainingIncome,
  openCategoryId,
  onPlannedIncomeChange,
  onCategoryPlanChange,
  onNotesChange,
  onAddCategory,
  onSave,
}: {
  currency: string;
  comparison: PlanComparison;
  incomeRows: PlanComparison["incomeRows"];
  expenseRows: PlanComparison["expenseRows"];
  plannedIncome: string;
  categoryPlans: Record<string, string>;
  notes: string;
  saving: boolean;
  allocatedExpenses: number;
  remainingIncome: number;
  openCategoryId: string | null;
  onPlannedIncomeChange: (value: string) => void;
  onCategoryPlanChange: (categoryId: string, value: string) => void;
  onNotesChange: (value: string) => void;
  onAddCategory: () => void;
  onSave: () => void;
}) {
  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">مقارنة الواقع بالخطة</h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        الفئات اللي ليها مبلغ في وضع الخطة بس. عدّل المخطط هنا، ثم احفظ خطة الشهر.
      </p>

      <form
        className="mt-6 space-y-8"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">الدخل</h3>
          <PlanComparisonTable
            comparison={comparison}
            currency={currency}
            rows={incomeRows}
            earnTone
            categoryPlans={{ income: plannedIncome }}
            onCategoryPlanChange={(_categoryId, value) => onPlannedIncomeChange(value)}
          />
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">المصروفات</h3>
            <button
              type="button"
              onClick={onAddCategory}
              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
            >
              + إضافة فئة
            </button>
          </div>
          {expenseRows.length > 0 ? (
            <PlanComparisonTable
              comparison={comparison}
              currency={currency}
              rows={expenseRows}
              initialOpenCategoryId={openCategoryId}
              categoryPlans={categoryPlans}
              onCategoryPlanChange={onCategoryPlanChange}
            />
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              مفيش فئات مصاريف بمبلغ في وضع الخطة. حط مبالغ هناك الأول.
            </p>
          )}
        </div>

        {expenseRows.length > 0 ? (
          <div className="space-y-1 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
            <p className="text-slate-600">
              مجموع الفئات{" "}
              <span className="font-semibold text-slate-900">
                {formatCurrency(allocatedExpenses, currency)}
              </span>
            </p>
            <p
              className={
                remainingIncome < 0
                  ? "font-medium text-red-600"
                  : "font-medium text-emerald-700"
              }
            >
              المتبقي من الدخل {formatCurrency(remainingIncome, currency)}
            </p>
          </div>
        ) : null}

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">ملاحظات على الخطة</span>
          <textarea
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
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
  );
}
