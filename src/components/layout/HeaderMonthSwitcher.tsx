"use client";

import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useSelectedMonth } from "@/components/month/SelectedMonthProvider";
import { getPlanMonthKey, shiftPlanMonthKey } from "@/lib/calendar";

export default function HeaderMonthSwitcher() {
  const t = useTranslations();
  const { planMonthKey, setPlanMonthKey, month, monthStartDay } = useSelectedMonth();
  const currentKey = getPlanMonthKey(new Date(), monthStartDay);
  const isCurrent = planMonthKey === currentKey;

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => setPlanMonthKey(shiftPlanMonthKey(planMonthKey, -1, monthStartDay))}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
        aria-label={t("monthSwitcher.previous")}
      >
        <span aria-hidden className="rtl:hidden">
          ‹
        </span>
        <span aria-hidden className="hidden rtl:inline">
          ›
        </span>
      </button>

      <label className="relative inline-flex h-9 min-w-36 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 px-3">
        <span className="text-sm font-semibold text-emerald-900">{month.label}</span>
        <input
          type="month"
          value={planMonthKey}
          onChange={(event) => setPlanMonthKey(event.target.value)}
          aria-label={t("monthSwitcher.pick")}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>

      <button
        type="button"
        onClick={() => setPlanMonthKey(shiftPlanMonthKey(planMonthKey, 1, monthStartDay))}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
        aria-label={t("monthSwitcher.next")}
      >
        <span aria-hidden className="rtl:hidden">
          ›
        </span>
        <span aria-hidden className="hidden rtl:inline">
          ‹
        </span>
      </button>

      {isCurrent ? null : (
        <button
          type="button"
          onClick={() => setPlanMonthKey(currentKey)}
          className="rounded-full px-2 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
        >
          {t("monthSwitcher.current")}
        </button>
      )}
    </div>
  );
}
