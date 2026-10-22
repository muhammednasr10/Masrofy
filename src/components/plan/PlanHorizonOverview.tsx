"use client";

import OverviewPeriodReadRow from "@/components/plan/overview/OverviewPeriodReadRow";
import PlanOverviewControls from "@/components/plan/overview/PlanOverviewControls";
import PlanOverviewPeriodTable, {
  PlanOverviewEmptyState,
} from "@/components/plan/overview/PlanOverviewPeriodTable";
import type { PlanOverviewPanelProps } from "@/components/plan/overview/planOverviewProps";
import { usePlanOverviewRange } from "@/components/plan/overview/usePlanOverviewRange";
import { buildOverviewDisplayRows } from "@/lib/plan/overview-rates";
import { overviewPeriodKey } from "@/lib/plan/overview-sandbox";

export type { PlanOverviewPanelProps as PlanHorizonOverviewProps };

export default function PlanHorizonOverview({
  currency,
  categories,
  lines,
  plannedMonthlyIncome,
  initialRangeStart,
  currentMonthStart,
  actualMonthIncome,
  actualMonthExpense,
}: PlanOverviewPanelProps) {
  const {
    view,
    setView,
    rangeStart,
    setRangeStart,
    rangeEnd,
    setRangeEnd,
    rangeReady,
  } = usePlanOverviewRange(initialRangeStart);

  const rows = rangeReady
    ? buildOverviewDisplayRows(
        {
          categories,
          lines,
          plannedMonthlyIncome,
          currentMonthStart,
          actualMonthIncome,
          actualMonthExpense,
        },
        view,
        rangeStart,
        rangeEnd,
      )
    : [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-900">نظرة عامة على الخطة</h2>
        <p className="text-sm text-slate-500">
          في العرض الشهري، الشهر المفتوح يورّي الواقع؛ مرّر عليه عشان تشوف المخطط.
        </p>
      </div>

      <PlanOverviewControls
        view={view}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        onViewChange={setView}
        onRangeStartChange={setRangeStart}
        onRangeEndChange={setRangeEnd}
      />

      {!rangeReady ? (
        <PlanOverviewEmptyState message="راجع تاريخ البداية والنهاية." />
      ) : rows.length === 0 ? (
        <PlanOverviewEmptyState message="مفيش فترات في المدى ده." />
      ) : (
        <PlanOverviewPeriodTable view={view}>
          {rows.map((row) => (
            <OverviewPeriodReadRow
              key={overviewPeriodKey(row)}
              row={row}
              currency={currency}
            />
          ))}
        </PlanOverviewPeriodTable>
      )}
    </div>
  );
}
