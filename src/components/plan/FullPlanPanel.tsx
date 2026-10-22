"use client";

import { useEffect, useState } from "react";
import FullPlanRow from "@/components/plan/FullPlanRow";
import {
  buildScopedPlanRows,
  collectConfirmedScopedLines,
  isCategoryRowVisible,
  type PlanKindTab,
} from "@/lib/plan/full-plan-rows";
import {
  buildRollupParentPatch,
  widestPlannedChildrenRange,
} from "@/lib/plan/horizon-rollup";
import { sumHorizonExpenses, type HorizonLineDraft } from "@/lib/plan/horizon";
import { formatCurrency } from "@/lib/utils/format";
import type { Category } from "@/lib/types/database";

const PLAN_KIND_TABS: Array<{ id: PlanKindTab; label: string }> = [
  { id: "income", label: "خطة الدخل" },
  { id: "expense", label: "خطة المصاريف" },
];

export default function FullPlanPanel({
  currency,
  categories,
  lines,
  saving,
  monthStart,
  monthEnd,
  onLineChange,
  onAddCategory,
  onSave,
}: {
  currency: string;
  categories: Category[];
  lines: Record<string, HorizonLineDraft>;
  saving: boolean;
  monthStart: string;
  monthEnd: string;
  onLineChange: (categoryId: string, patch: Partial<HorizonLineDraft>) => void;
  onAddCategory: () => void;
  onSave: () => void;
}) {
  const [planKind, setPlanKind] = useState<PlanKindTab>("expense");
  const [expandedParentIds, setExpandedParentIds] = useState<Set<string>>(() => new Set());
  const { scopedCategories, rows } = buildScopedPlanRows(categories, lines, planKind);
  const categoriesById = new Map(scopedCategories.map((category) => [category.id, category]));
  const visibleRows = rows.filter(({ category }) =>
    isCategoryRowVisible(category, categoriesById, expandedParentIds),
  );
  const scopedLines = collectConfirmedScopedLines(rows, scopedCategories, lines);
  const periodTotal = sumHorizonExpenses(scopedLines);
  const monthTotal = sumHorizonExpenses(scopedLines, monthStart, monthEnd);
  const emptyLabel =
    planKind === "income"
      ? "مفيش فئات دخل لسه. اضغط «إضافة فئة» واختَر نوعها دخل."
      : "مفيش فئات مصاريف لسه. اضغط «إضافة فئة» للبدء.";
  const amountAriaPrefix = planKind === "income" ? "دخل" : "مصروف";
  const totalLabel = planKind === "income" ? "إجمالي الدخل" : "إجمالي المصاريف";

  useEffect(() => {
    for (const category of scopedCategories) {
      const patch = buildRollupParentPatch(category.id, scopedCategories, lines);

      if (patch) {
        onLineChange(category.id, patch);
      }
    }
    // Sync derived parent amount/dates when children change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onLineChange identity is unstable
  }, [scopedCategories, lines]);

  function toggleParent(categoryId: string) {
    setExpandedParentIds((current) => {
      const next = new Set(current);

      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }

      return next;
    });
  }

  function syncParentDatesFromChildren(categoryId: string) {
    const widest = widestPlannedChildrenRange(categoryId, scopedCategories, lines);

    if (!widest) {
      return;
    }

    onLineChange(categoryId, {
      startDate: widest.startDate,
      endDate: widest.endDate,
      datesManual: false,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {PLAN_KIND_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setPlanKind(tab.id)}
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
              planKind === tab.id
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          لو الفئة فيها فروع بمبلغ: المبلغ مجموع الفروع، والفترة أوسع مدى منهم (وتقدر تعدّلها يدوي). «محتمل»
          مش بيتحسب في الإجماليات.
        </p>
        <button
          type="button"
          onClick={onAddCategory}
          className="shrink-0 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
        >
          + إضافة فئة
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          {emptyLabel}
        </p>
      ) : (
        <div className="rounded-2xl border border-slate-100 md:overflow-hidden">
          <table className="stack-table w-full text-sm md:table-fixed">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <th className="w-[22%] px-2 py-3 text-center font-medium">الفئة</th>
                <th className="w-[12%] px-1 py-3 text-center font-medium">المبلغ</th>
                <th className="w-[12%] px-1 py-3 text-center font-medium">التكرار</th>
                <th className="w-[12%] px-1 py-3 text-center font-medium">الحالة</th>
                <th className="w-[14%] px-1 py-3 text-center font-medium">البداية</th>
                <th className="w-[14%] px-1 py-3 text-center font-medium">النهاية</th>
                <th className="w-[14%] px-1 py-3 text-center font-medium">إجمالي الفترة</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(({ category, depth }) => {
                const line = lines[category.id];

                if (!line) {
                  return null;
                }

                return (
                  <FullPlanRow
                    key={category.id}
                    category={category}
                    depth={depth}
                    line={line}
                    scopedCategories={scopedCategories}
                    lines={lines}
                    currency={currency}
                    amountAriaPrefix={amountAriaPrefix}
                    isOpen={expandedParentIds.has(category.id)}
                    onToggleParent={toggleParent}
                    onLineChange={onLineChange}
                    onSyncParentDates={syncParentDatesFromChildren}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {totalLabel} (مؤكد فقط){" "}
          <span className="mt-1 block text-lg font-semibold text-slate-900">
            {formatCurrency(periodTotal, currency)}
          </span>
        </div>
        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          في الشهر المفتوح (مؤكد فقط){" "}
          <span className="mt-1 block text-lg font-semibold text-emerald-900">
            {formatCurrency(monthTotal, currency)}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {saving ? "جاري الحفظ..." : "حفظ وضع الخطة"}
      </button>
    </div>
  );
}
