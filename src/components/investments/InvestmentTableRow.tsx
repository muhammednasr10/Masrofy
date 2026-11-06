import { memo } from "react";
import InvestmentRowActions from "@/components/investments/InvestmentRowActions";
import type { InvestmentRow, InvestmentRowHandlers } from "@/components/investments/investment-row";
import { investmentTypeOptions } from "@/lib/constants/investment-options";
import { formatProfitPeriod, getLatestProfitEntry } from "@/lib/investments/profit-entries";
import {
  getCollectionPeriodLabel,
  getCollectionStatusLabel,
  getFixedProfitAmount,
} from "@/lib/investments/utils";
import type { InvestmentProfitEntry } from "@/lib/types/database";
import { formatCurrency, formatDate } from "@/lib/utils/format";

const InvestmentTableRow = memo(function InvestmentTableRow({
  row,
  index,
  totalRows,
  currency,
  profitEntries,
  reorderingId,
  onMoveInvestment,
  onEditInvestment,
  onLogProfit,
  onUpdateValue,
  onViewHistory,
  onDeleteInvestment,
}: {
  row: InvestmentRow;
  index: number;
  totalRows: number;
  currency: string;
  profitEntries: InvestmentProfitEntry[];
  reorderingId: string | null;
  onMoveInvestment: (investmentId: string, direction: "up" | "down") => void;
} & InvestmentRowHandlers) {
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
    <tr className="border-b border-slate-100 last:border-0">
      <td className="px-3 py-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={index === 0 || reorderingId === investment.id}
            onClick={() => onMoveInvestment(investment.id, "up")}
            className="rounded-lg px-2 py-1 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
            aria-label="تحريك لأعلى"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={index === totalRows - 1 || reorderingId === investment.id}
            onClick={() => onMoveInvestment(investment.id, "down")}
            className="rounded-lg px-2 py-1 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
            aria-label="تحريك لأسفل"
          >
            ↓
          </button>
        </div>
      </td>
      <td className="px-3 py-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
            style={{ backgroundColor: `${investment.color}25` }}
          >
            {investment.icon}
          </span>
          <div>
            <p className="font-medium text-slate-900">{investment.name}</p>
            {investment.quantity != null && investment.unit_label ? (
              <p className="text-xs text-slate-500">
                {investment.quantity} {investment.unit_label}
              </p>
            ) : null}
            {investment.is_fixed_return && investment.fixed_return_percent != null ? (
              <p className="text-xs text-amber-700">
                {getCollectionPeriodLabel(investment.collection_period)} •{" "}
                {Number(investment.fixed_return_percent).toFixed(2)}% • ربح متوقع{" "}
                {formatCurrency(getFixedProfitAmount(investment), currency)}
              </p>
            ) : latestProfitEntry ? (
              <p className="text-xs text-slate-500">آخر قيد: {formatProfitPeriod(latestProfitEntry)}</p>
            ) : null}
            {investment.notes ? <p className="text-xs text-slate-500">{investment.notes}</p> : null}
          </div>
        </div>
      </td>
      <td className="px-3 py-4 text-slate-600">{typeLabel}</td>
      <td className="px-3 py-4 text-slate-700">
        {formatCurrency(Number(investment.cost_basis), currency)}
      </td>
      <td className="px-3 py-4 font-medium text-slate-900">
        {formatCurrency(displayValue, currency)}
        {investment.is_fixed_return && collectionStatus !== "collected" ? (
          <p className="text-xs font-normal text-slate-500">قيمة متوقعة</p>
        ) : null}
      </td>
      <td className="px-3 py-4">
        {investment.is_fixed_return && investment.collection_date ? (
          <div>
            <p className="text-xs text-slate-500">
              {getCollectionPeriodLabel(investment.collection_period)}
            </p>
            <p className="font-medium text-slate-900">{formatDate(investment.collection_date)}</p>
            {collectionStatus ? (
              <p className={`text-xs ${statusTone}`}>
                {getCollectionStatusLabel(collectionStatus)}
                {collectionStatus === "pending" && daysUntilCollection != null
                  ? ` • بعد ${daysUntilCollection} يوم`
                  : ""}
              </p>
            ) : null}
          </div>
        ) : latestProfitEntry ? (
          <div>
            <p className="text-xs text-slate-500">آخر فترة</p>
            <p className="font-medium text-slate-900">{formatProfitPeriod(latestProfitEntry)}</p>
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>
      <td className="px-3 py-4">
        <p className={`font-semibold ${profitTone}`}>
          {profit >= 0 ? "+" : ""}
          {formatCurrency(profit, currency)}
        </p>
        {returnPercent != null ? (
          <p className={`text-xs ${profitTone}`}>
            {returnPercent >= 0 ? "+" : ""}
            {returnPercent.toFixed(2)}%
          </p>
        ) : null}
        {investment.is_fixed_return && investment.fixed_return_percent != null ? (
          <p className="text-xs text-amber-700">
            {getCollectionPeriodLabel(investment.collection_period)} •{" "}
            {Number(investment.fixed_return_percent).toFixed(2)}%
          </p>
        ) : null}
      </td>
      <td className="px-3 py-4">
        <InvestmentRowActions
          investment={investment}
          onEditInvestment={onEditInvestment}
          onLogProfit={onLogProfit}
          onUpdateValue={onUpdateValue}
          onViewHistory={onViewHistory}
          onDeleteInvestment={onDeleteInvestment}
        />
      </td>
    </tr>
  );
});

export default InvestmentTableRow;
