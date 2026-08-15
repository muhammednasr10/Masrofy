"use client";

import { getPlanMonthKey, shiftPlanMonthKey } from "@/lib/calendar";

type PlanMonthPickerProps = {
  planMonthKey: string;
  monthLabel: string;
  monthStartDay?: number;
  onChange: (planMonthKey: string) => void;
  onOpenAnnualPlan?: () => void;
  planYear?: number;
  hasAnnualTemplate?: boolean;
};

export default function PlanMonthPicker({
  planMonthKey,
  monthLabel,
  monthStartDay = 1,
  onChange,
  onOpenAnnualPlan,
  planYear,
  hasAnnualTemplate = false,
}: PlanMonthPickerProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-emerald-700">خطة الشهر</p>
        <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{monthLabel}</h2>
      </div>

      <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
        <div className="grid grid-cols-2 gap-2 sm:contents">
          <button
            type="button"
            onClick={() => onChange(shiftPlanMonthKey(planMonthKey, -1, monthStartDay))}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            الشهر السابق
          </button>
          <button
            type="button"
            onClick={() => onChange(shiftPlanMonthKey(planMonthKey, 1, monthStartDay))}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            الشهر التالي
          </button>
        </div>

        <input
          type="month"
          value={planMonthKey}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 sm:w-auto"
        />

        <button
          type="button"
          onClick={() => onChange(getPlanMonthKey(new Date(), monthStartDay))}
          className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 sm:w-auto"
        >
          الشهر الحالي
        </button>

        {onOpenAnnualPlan ? (
          <button
            type="button"
            onClick={onOpenAnnualPlan}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
          >
            {hasAnnualTemplate
              ? `الخطة الافتراضية ${planYear ?? ""}`
              : `إعداد الخطة الافتراضية ${planYear ?? ""}`}
          </button>
        ) : null}
      </div>
    </div>
  );
}
