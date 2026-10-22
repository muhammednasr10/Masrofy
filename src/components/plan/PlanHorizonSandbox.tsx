"use client";

import { useEffect, useMemo, useState } from "react";
import PlanOverviewControls from "@/components/plan/overview/PlanOverviewControls";
import PlanOverviewPeriodTable, {
  PlanOverviewEmptyState,
} from "@/components/plan/overview/PlanOverviewPeriodTable";
import SandboxPeriodEditRow from "@/components/plan/overview/SandboxPeriodEditRow";
import { usePlanOverviewRange } from "@/components/plan/overview/usePlanOverviewRange";
import type { PlanOverviewPanelProps } from "@/components/plan/overview/planOverviewProps";
import { buildOverviewDisplayRows, type OverviewPeriodRow } from "@/lib/plan/overview-rates";
import {
  applySandboxOverrides,
  overviewPeriodKey,
  parseMoneyInput,
  type PeriodOverride,
} from "@/lib/plan/overview-sandbox";

export default function PlanHorizonSandbox({
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
  const [overrides, setOverrides] = useState<Record<string, PeriodOverride>>({});

  const baseRows = useMemo(() => {
    if (!rangeReady) {
      return [];
    }

    return buildOverviewDisplayRows(
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
    );
  }, [
    actualMonthExpense,
    actualMonthIncome,
    categories,
    currentMonthStart,
    lines,
    plannedMonthlyIncome,
    rangeEnd,
    rangeReady,
    rangeStart,
    view,
  ]);

  useEffect(() => {
    setOverrides({});
  }, [view, rangeStart, rangeEnd]);

  const rows = applySandboxOverrides(baseRows, overrides);
  const hasOverrides = Object.keys(overrides).length > 0;

  function updatePeriod(
    row: OverviewPeriodRow,
    field: "income" | "expense",
    raw: string,
  ) {
    const value = parseMoneyInput(raw);
    const key = overviewPeriodKey(row);
    const base = baseRows.find((item) => overviewPeriodKey(item) === key) ?? row;

    setOverrides((prev) => {
      const current = prev[key] ?? { income: base.income, expense: base.expense };
      return {
        ...prev,
        [key]: {
          ...current,
          [field]: value,
        },
      };
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">حسابات</h2>
          <p className="text-sm text-slate-500">
            نفس جدول النظرة العامة، بس تقدر تعدّل الدخل والمصروف وتجرّب الحساب. التعديل هنا مش بيتسجل على
            الخطة.
          </p>
        </div>
        {hasOverrides ? (
          <button
            type="button"
            onClick={() => setOverrides({})}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            رجّع الأرقام الأصلية
          </button>
        ) : null}
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
            <SandboxPeriodEditRow
              key={overviewPeriodKey(row)}
              row={row}
              currency={currency}
              onIncomeChange={(value) => updatePeriod(row, "income", value)}
              onExpenseChange={(value) => updatePeriod(row, "expense", value)}
            />
          ))}
        </PlanOverviewPeriodTable>
      )}
    </div>
  );
}
