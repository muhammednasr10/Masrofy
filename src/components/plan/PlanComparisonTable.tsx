"use client";

import { useEffect, useState } from "react";
import { PlanComparisonParentRow } from "@/components/plan/PlanComparisonParentRow";
import { getCategoryBudgetTone } from "@/lib/plan/budget-warning";
import { formatCurrency } from "@/lib/utils/format";
import type { PlanComparison } from "@/lib/types/database";

export default function PlanComparisonTable({
  comparison,
  currency,
  initialOpenCategoryId,
  categoryPlans,
  onCategoryPlanChange,
  rows,
  earnTone = false,
}: {
  comparison: PlanComparison;
  currency: string;
  initialOpenCategoryId?: string | null;
  categoryPlans?: Record<string, string>;
  onCategoryPlanChange?: (categoryId: string, value: string) => void;
  rows?: PlanComparison["expenseRows"];
  earnTone?: boolean;
}) {
  const [openIds, setOpenIds] = useState<Set<string>>(() =>
    initialOpenCategoryId ? new Set([initialOpenCategoryId]) : new Set(),
  );

  useEffect(() => {
    if (!initialOpenCategoryId) {
      return;
    }

    document.getElementById(`plan-category-${initialOpenCategoryId}`)?.scrollIntoView({
      block: "center",
    });
  }, [initialOpenCategoryId]);

  function toggleRow(categoryId: string) {
    setOpenIds((current) => {
      const next = new Set(current);

      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }

      return next;
    });
  }

  return (
    <div className="x-scroll rounded-2xl border border-slate-100">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <th className="px-4 py-3 text-right font-medium">الفئة</th>
            <th className="px-4 py-3 text-right font-medium">المخطط</th>
            <th className="px-4 py-3 text-right font-medium">الواقع</th>
            <th className="px-4 py-3 text-right font-medium">الفرق</th>
            <th className="px-4 py-3 text-right font-medium">التقدم</th>
          </tr>
        </thead>
        <tbody>
          {[...(rows ?? comparison.expenseRows)]
            .sort((left, right) => {
              const leftPlanned = onCategoryPlanChange
                ? Number(categoryPlans?.[left.categoryId] || 0)
                : left.planned;
              const rightPlanned = onCategoryPlanChange
                ? Number(categoryPlans?.[right.categoryId] || 0)
                : right.planned;

              if (rightPlanned !== leftPlanned) {
                return rightPlanned - leftPlanned;
              }

              return right.actual - left.actual;
            })
            .map((row) => {
            const planned = onCategoryPlanChange
              ? Number(categoryPlans?.[row.categoryId] || 0)
              : row.planned;
            const tone = getCategoryBudgetTone(planned, row.actual);
            const children = row.children ?? [];

            return (
              <PlanComparisonParentRow
                key={row.categoryId}
                categoryId={row.categoryId}
                name={row.name}
                icon={row.icon}
                planned={planned}
                actual={row.actual}
                difference={row.actual - planned}
                progressPercent={planned > 0 ? Math.min(100, (row.actual / planned) * 100) : null}
                currency={currency}
                open={openIds.has(row.categoryId)}
                children={children}
                onToggle={children.length > 0 ? () => toggleRow(row.categoryId) : undefined}
                plannedDraft={categoryPlans?.[row.categoryId] ?? ""}
                onPlannedChange={
                  onCategoryPlanChange
                    ? (value) => onCategoryPlanChange(row.categoryId, value)
                    : undefined
                }
                {...tone}
                earnTone={earnTone}
              />
            );
          })}
        </tbody>
      </table>

      {!earnTone && comparison.uncategorizedExpenses > 0 ? (
        <div className="border-t border-slate-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          مصروفات بدون فئة هذا الشهر:{" "}
          {formatCurrency(comparison.uncategorizedExpenses, currency)}
        </div>
      ) : null}
    </div>
  );
}
