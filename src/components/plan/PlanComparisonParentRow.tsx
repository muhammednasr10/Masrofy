import { PlanComparisonChildRow } from "@/components/plan/PlanComparisonChildRow";
import { formatCurrency } from "@/lib/utils/format";
import type { PlanComparisonChildRow as PlanComparisonChild } from "@/lib/types/database";

export function PlanComparisonParentRow({
  categoryId,
  name,
  icon,
  planned,
  actual,
  difference,
  progressPercent,
  overBudget,
  nearBudget,
  underBudget,
  earnTone = false,
  currency,
  open,
  children,
  onToggle,
  plannedDraft,
  onPlannedChange,
}: {
  categoryId: string;
  name: string;
  icon: string;
  planned: number;
  actual: number;
  difference: number;
  progressPercent: number | null;
  overBudget: boolean;
  nearBudget: boolean;
  underBudget: boolean;
  earnTone?: boolean;
  currency: string;
  open: boolean;
  children: PlanComparisonChild[];
  onToggle?: () => void;
  plannedDraft?: string;
  onPlannedChange?: (value: string) => void;
}) {
  const differenceClass =
    difference === 0
      ? "text-slate-500"
      : earnTone
        ? difference > 0
          ? "text-emerald-700"
          : "text-amber-700"
        : overBudget
          ? "text-red-600"
          : underBudget
            ? "text-emerald-700"
            : "text-slate-700";
  const barClass = earnTone
    ? planned > 0 && actual >= planned
      ? "bg-emerald-500"
      : "bg-amber-500"
    : overBudget
      ? "bg-red-500"
      : nearBudget
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <>
      <tr id={`plan-category-${categoryId}`} className="border-b border-slate-100 last:border-0">
        <td className="px-4 py-4">
          <span className="flex items-center gap-2 font-medium text-slate-900">
            {onToggle ? (
              <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                aria-label={open ? `إخفاء فئات ${name}` : `عرض فئات ${name}`}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
              >
                <span className={`inline-block transition ${open ? "rotate-180" : ""}`}>▾</span>
              </button>
            ) : (
              <span className="inline-block w-7" />
            )}
            <span>{icon}</span>
            {name}
          </span>
        </td>
        <td className="px-4 py-4 text-slate-700">
          {onPlannedChange ? (
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={plannedDraft ?? ""}
              onChange={(event) => onPlannedChange(event.target.value)}
              aria-label={`المخطط لفئة ${name}`}
              placeholder="0"
              className="w-28 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
          ) : (
            formatCurrency(planned, currency)
          )}
        </td>
        <td className="px-4 py-4 font-medium text-slate-900">{formatCurrency(actual, currency)}</td>
        <td className={`px-4 py-4 font-medium ${differenceClass}`}>
          {difference === 0
            ? formatCurrency(0, currency)
            : `${difference > 0 ? "+" : ""}${formatCurrency(difference, currency)}`}
        </td>
        <td className="px-4 py-4">
          {planned > 0 ? (
            <div className="space-y-1">
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className={`h-2 rounded-full ${barClass}`}
                  style={{ width: `${Math.min(100, progressPercent ?? 0)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">{Math.round(progressPercent ?? 0)}%</p>
            </div>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </td>
      </tr>
      {open
        ? children.map((child) => (
            <PlanComparisonChildRow
              key={child.categoryId}
              child={child}
              parentActual={actual}
              currency={currency}
            />
          ))
        : null}
    </>
  );
}
