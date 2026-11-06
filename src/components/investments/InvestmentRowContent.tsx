import type { InvestmentRow } from "@/components/investments/investment-row";
import { investmentTypeOptions } from "@/lib/constants/investment-options";
import { getCollectionPeriodLabel, getCollectionStatusLabel } from "@/lib/investments/utils";
import { formatProfitPeriod, getLatestProfitEntry } from "@/lib/investments/profit-entries";
import type { InvestmentProfitEntry } from "@/lib/types/database";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default function InvestmentRowContent({
  row,
  currency,
  profitEntries,
  compact = false,
}: {
  row: InvestmentRow;
  currency: string;
  profitEntries: InvestmentProfitEntry[];
  compact?: boolean;
}) {
  const { investment, profit, returnPercent, collectionStatus, daysUntilCollection, displayValue } =
    row;
  const latestProfitEntry = getLatestProfitEntry(profitEntries);
  const typeLabel =
    investmentTypeOptions.find((item) => item.value === investment.investment_type)?.label ??
    investment.investment_type;
  const profitTone = profit >= 0 ? "text-emerald-700" : "text-red-600";
  const statusTone =
    collectionStatus === "overdue"
      ? "text-red-600"
      : collectionStatus === "due_today"
        ? "text-amber-700"
        : collectionStatus === "collected"
          ? "text-emerald-700"
          : "text-slate-600";

  return (
    <div className="flex items-start gap-3">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
        style={{ backgroundColor: `${investment.color}25` }}
      >
        {investment.icon}
      </span>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{investment.name}</p>
            <p className="text-xs text-slate-500">{typeLabel}</p>
          </div>
          <p className="shrink-0 font-semibold text-slate-900">
            {formatCurrency(displayValue, currency)}
          </p>
        </div>

        <div className={`grid gap-2 ${compact ? "grid-cols-2" : ""}`}>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-500">المستثمر</p>
            <p className="text-sm font-medium text-slate-800">
              {formatCurrency(Number(investment.cost_basis), currency)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-500">الربح/الخسارة</p>
            <p className={`text-sm font-semibold ${profitTone}`}>
              {profit >= 0 ? "+" : ""}
              {formatCurrency(profit, currency)}
            </p>
            {returnPercent != null ? (
              <p className={`text-xs ${profitTone}`}>
                {returnPercent >= 0 ? "+" : ""}
                {returnPercent.toFixed(2)}%
              </p>
            ) : null}
          </div>
        </div>

        {investment.is_fixed_return && investment.collection_date ? (
          <p className={`text-xs ${statusTone}`}>
            {getCollectionPeriodLabel(investment.collection_period)} •{" "}
            {formatDate(investment.collection_date)}
            {collectionStatus ? ` • ${getCollectionStatusLabel(collectionStatus)}` : ""}
            {collectionStatus === "pending" && daysUntilCollection != null
              ? ` • بعد ${daysUntilCollection} يوم`
              : ""}
          </p>
        ) : latestProfitEntry ? (
          <p className="text-xs text-slate-500">آخر قيد: {formatProfitPeriod(latestProfitEntry)}</p>
        ) : null}
      </div>
    </div>
  );
}
