"use client";

import type { Category } from "@/lib/types/database";
import { getParentCategories } from "@/lib/categories/hierarchy";
import { formatCurrency } from "@/lib/utils/format";

type PlanEditorProps = {
  plannedIncome: string;
  categoryPlans: Record<string, string>;
  categories: Category[];
  notes: string;
  saving: boolean;
  onPlannedIncomeChange: (value: string) => void;
  onCategoryPlanChange: (categoryId: string, value: string) => void;
  onNotesChange: (value: string) => void;
  onSubmit: () => void;
  onAddCategory: () => void;
  hideCategoryAddButton?: boolean;
  hideSaveButton?: boolean;
  incomeLabel?: string;
  notesPlaceholder?: string;
  currency?: string;
};

export default function PlanEditor({
  plannedIncome,
  categoryPlans,
  categories,
  notes,
  saving,
  onPlannedIncomeChange,
  onCategoryPlanChange,
  onNotesChange,
  onSubmit,
  onAddCategory,
  hideCategoryAddButton = false,
  hideSaveButton = false,
  incomeLabel = "الدخل المخطط للشهر",
  notesPlaceholder = "مثال: الشهر ده فيه مصاريف مدرسة وزيادة فواتير...",
  currency = "EGP",
}: PlanEditorProps) {
  const parentCategories = getParentCategories(categories).sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ar"),
  );
  const plannedIncomeAmount = Number(plannedIncome) || 0;
  const allocatedExpenses = parentCategories.reduce(
    (total, category) => total + (Number(categoryPlans[category.id]) || 0),
    0,
  );
  const remainingIncome = plannedIncomeAmount - allocatedExpenses;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-6"
    >
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">{incomeLabel}</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={plannedIncome}
          onChange={(event) => onPlannedIncomeChange(event.target.value)}
          placeholder="0.00"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        />
      </label>

      <div>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium text-slate-700">مصروفات مخططة حسب الفئة</h3>
            <p className="mt-1 text-xs text-slate-500">
              ارسم ميزانيتك لكل فئة رئيسية. مصروفات الفئات الفرعية بتتحسب جواها.
            </p>
          </div>
          {!hideCategoryAddButton ? (
            <button
              type="button"
              onClick={onAddCategory}
              className="shrink-0 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
            >
              + إضافة فئة
            </button>
          ) : null}
        </div>

        {categories.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            مفيش فئات لسه. اضغط «إضافة فئة» للبدء.
          </p>
        ) : (
        <div className="space-y-3">
          {parentCategories.map((category) => (
            <label key={category.id} className="flex items-center gap-3">
              <span className="flex w-40 shrink-0 items-center gap-2 text-sm text-slate-700">
                <span>{category.icon}</span>
                {category.name}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={categoryPlans[category.id] ?? ""}
                onChange={(event) => onCategoryPlanChange(category.id, event.target.value)}
                placeholder="0.00"
                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 outline-none focus:border-emerald-500"
              />
            </label>
          ))}
        </div>
        )}

        {parentCategories.length > 0 ? (
          <div className="mt-4 space-y-1 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
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
        ) : null}
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">ملاحظات على الخطة</span>
        <textarea
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          rows={3}
          placeholder={notesPlaceholder}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        />
      </label>

      {!hideSaveButton ? (
        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? "جاري الحفظ..." : "حفظ الخطة"}
        </button>
      ) : null}
    </form>
  );
}
