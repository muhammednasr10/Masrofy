"use client";

import {
  OVERVIEW_VIEWS,
  OVERVIEW_VIEW_LABELS,
  type OverviewView,
} from "@/lib/plan/overview-rates";

export default function PlanOverviewControls({
  view,
  rangeStart,
  rangeEnd,
  onViewChange,
  onRangeStartChange,
  onRangeEndChange,
}: {
  view: OverviewView;
  rangeStart: string;
  rangeEnd: string;
  onViewChange: (view: OverviewView) => void;
  onRangeStartChange: (value: string) => void;
  onRangeEndChange: (value: string) => void;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">من</span>
          <input
            type="date"
            value={rangeStart}
            max={rangeEnd || undefined}
            onChange={(event) => onRangeStartChange(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">إلى</span>
          <input
            type="date"
            value={rangeEnd}
            min={rangeStart || undefined}
            onChange={(event) => onRangeEndChange(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {OVERVIEW_VIEWS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onViewChange(option)}
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
              view === option
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {OVERVIEW_VIEW_LABELS[option]}
          </button>
        ))}
      </div>
    </>
  );
}
