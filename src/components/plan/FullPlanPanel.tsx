"use client";

import { buildCategoryDisplayRows } from "@/lib/categories/hierarchy";
import {
  HORIZON_CADENCES,
  isDateKey,
  occurrenceCount,
  sumHorizonExpenses,
  type HorizonCadence,
  type HorizonLineDraft,
} from "@/lib/plan/horizon";
import { formatCurrency } from "@/lib/utils/format";
import type { Category } from "@/lib/types/database";

const CADENCE_LABELS: Record<HorizonCadence, string> = {
  daily: "يومي",
  weekly: "أسبوعي",
  monthly: "شهري",
  yearly: "سنوي",
};

function lineDatesReady(line: HorizonLineDraft) {
  return isDateKey(line.startDate) && isDateKey(line.endDate) && line.endDate >= line.startDate;
}

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
  const rows = buildCategoryDisplayRows(categories);
  const expenseLines = rows.flatMap(({ category }) => {
    const line = lines[category.id];

    if (!line || !lineDatesReady(line)) {
      return [];
    }

    return [
      {
        amount: Number(line.amount || 0),
        cadence: line.cadence,
        startDate: line.startDate,
        endDate: line.endDate,
      },
    ];
  });
  const periodTotal = sumHorizonExpenses(expenseLines);
  const monthTotal = sumHorizonExpenses(expenseLines, monthStart, monthEnd);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          لكل فئة مبلغ، وتكرار يومي أو أسبوعي أو شهري أو سنوي، ويوم بداية ويوم نهاية خاصين بيها.
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
          مفيش فئات لسه. اضغط «إضافة فئة» للبدء.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map(({ category, depth }) => {
            const line = lines[category.id];

            if (!line) {
              return null;
            }

            const ready = lineDatesReady(line);
            const amount = Number(line.amount || 0);
            const repeats = ready ? occurrenceCount(line.cadence, line.startDate, line.endDate) : 0;

            return (
              <article
                key={category.id}
                className="space-y-3 rounded-2xl border border-slate-200 p-4"
                style={{ marginInlineStart: depth > 0 ? `${depth * 1.25}rem` : undefined }}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <span>{category.icon}</span>
                  {category.name}
                </span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="text-xs text-slate-500">المبلغ</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={line.amount}
                      onChange={(event) => onLineChange(category.id, { amount: event.target.value })}
                      placeholder="0"
                      aria-label={`مصروف ${category.name}`}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs text-slate-500">التكرار</span>
                    <select
                      value={line.cadence}
                      onChange={(event) =>
                        onLineChange(category.id, { cadence: event.target.value as HorizonCadence })
                      }
                      aria-label={`تكرار ${category.name}`}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-emerald-500"
                    >
                      {HORIZON_CADENCES.map((cadence) => (
                        <option key={cadence} value={cadence}>
                          {CADENCE_LABELS[cadence]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs text-slate-500">يوم البداية</span>
                    <input
                      type="date"
                      value={line.startDate}
                      onChange={(event) => onLineChange(category.id, { startDate: event.target.value })}
                      aria-label={`بداية ${category.name}`}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs text-slate-500">يوم النهاية</span>
                    <input
                      type="date"
                      value={line.endDate}
                      min={line.startDate || undefined}
                      onChange={(event) => onLineChange(category.id, { endDate: event.target.value })}
                      aria-label={`نهاية ${category.name}`}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500"
                    />
                  </label>
                </div>
                <p className="text-sm text-slate-500">
                  {ready && amount > 0
                    ? `${formatCurrency(amount * repeats, currency)} في فترة الفئة`
                    : ready
                      ? "—"
                      : "يوم النهاية لازم يكون بعد يوم البداية."}
                </p>
              </article>
            );
          })}
        </div>
      )}

      <div className="space-y-1 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
        <p className="text-slate-600">
          إجمالي كل الفئات{" "}
          <span className="font-semibold text-slate-900">{formatCurrency(periodTotal, currency)}</span>
        </p>
        <p className="font-medium text-emerald-800">في الشهر المفتوح {formatCurrency(monthTotal, currency)}</p>
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {saving ? "جاري الحفظ..." : "حفظ الخطة الكاملة"}
      </button>
    </div>
  );
}
