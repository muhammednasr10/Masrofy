"use client";

import { investmentTypeOptions } from "@/lib/constants/investment-options";
import {
  getCollectionPeriodLabel,
  getCollectionStatusLabel,
  getFixedProfitAmount,
  type CollectionStatus,
} from "@/lib/investments/utils";
import type { Investment, InvestmentProfitEntry } from "@/lib/types/database";
import { formatProfitPeriod, getLatestProfitEntry } from "@/lib/investments/profit-entries";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { memo } from "react";
import IconActionButton from "@/components/ui/IconActionButton";
import ReorderButton from "@/components/ui/ReorderButton";

type InvestmentRow = {
  investment: Investment;
  profit: number;
  returnPercent: number | null;
  collectionStatus: CollectionStatus | null;
  daysUntilCollection: number | null;
  displayValue: number;
};

type InvestmentsTableProps = {
  rows: InvestmentRow[];
  currency: string;
  profitEntriesByInvestment: Record<string, InvestmentProfitEntry[]>;
  reorderingId: string | null;
  onMoveInvestment: (investmentId: string, direction: "up" | "down") => void;
  onEditInvestment: (investment: Investment) => void;
  onLogProfit: (investment: Investment) => void;
  onUpdateValue: (investment: Investment) => void;
  onViewHistory: (investment: Investment) => void;
  onDeleteInvestment: (investmentId: string) => void;
};

export default function InvestmentsTable({
  rows,
  currency,
  profitEntriesByInvestment,
  reorderingId,
  onMoveInvestment,
  onEditInvestment,
  onLogProfit,
  onUpdateValue,
  onViewHistory,
  onDeleteInvestment,
}: InvestmentsTableProps) {
  if (rows.length === 0) {
    return <p className="mt-4 text-sm text-slate-500">ابدأ بإضافة أول استثمار.</p>;
  }

  const sharedProps = {
    currency,
    profitEntriesByInvestment,
    reorderingId,
    onMoveInvestment,
    onEditInvestment,
    onLogProfit,
    onUpdateValue,
    onViewHistory,
    onDeleteInvestment,
  };

  return (
    <>
      <div className="mt-4 space-y-3 md:hidden">
        {rows.map((row, index) => (
          <InvestmentMobileCard
            key={row.investment.id}
            row={row}
            index={index}
            totalRows={rows.length}
            {...sharedProps}
          />
        ))}
      </div>

      <div className="mt-4 hidden x-scroll md:block">
        <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="px-3 py-3 text-right font-medium">الترتيب</th>
            <th className="px-3 py-3 text-right font-medium">الاستثمار</th>
            <th className="px-3 py-3 text-right font-medium">النوع</th>
            <th className="px-3 py-3 text-right font-medium">المستثمر</th>
            <th className="px-3 py-3 text-right font-medium">الحالي / المتوقع</th>
            <th className="px-3 py-3 text-right font-medium">ميعاد القبض</th>
            <th className="px-3 py-3 text-right font-medium">الربح/الخسارة</th>
            <th className="px-3 py-3 text-right font-medium">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <InvestmentTableRow
              key={row.investment.id}
              row={row}
              index={index}
              totalRows={rows.length}
              currency={currency}
              profitEntries={profitEntriesByInvestment[row.investment.id] ?? []}
              reorderingId={reorderingId}
              onMoveInvestment={onMoveInvestment}
              onEditInvestment={onEditInvestment}
              onLogProfit={onLogProfit}
              onUpdateValue={onUpdateValue}
              onViewHistory={onViewHistory}
              onDeleteInvestment={onDeleteInvestment}
            />
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}

const InvestmentMobileCard = memo(function InvestmentMobileCard({
  row,
  index,
  totalRows,
  currency,
  profitEntriesByInvestment,
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
  profitEntriesByInvestment: Record<string, InvestmentProfitEntry[]>;
  reorderingId: string | null;
  onMoveInvestment: (investmentId: string, direction: "up" | "down") => void;
  onEditInvestment: (investment: Investment) => void;
  onLogProfit: (investment: Investment) => void;
  onUpdateValue: (investment: Investment) => void;
  onViewHistory: (investment: Investment) => void;
  onDeleteInvestment: (investmentId: string) => void;
}) {
  const profitEntries = profitEntriesByInvestment[row.investment.id] ?? [];

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <InvestmentRowContent
        row={row}
        currency={currency}
        profitEntries={profitEntries}
        compact
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-1">
          <ReorderButton
            direction="up"
            disabled={index === 0 || reorderingId === row.investment.id}
            onClick={() => onMoveInvestment(row.investment.id, "up")}
          />
          <ReorderButton
            direction="down"
            disabled={index === totalRows - 1 || reorderingId === row.investment.id}
            onClick={() => onMoveInvestment(row.investment.id, "down")}
          />
        </div>

        <InvestmentRowActions
          investment={row.investment}
          onEditInvestment={onEditInvestment}
          onLogProfit={onLogProfit}
          onUpdateValue={onUpdateValue}
          onViewHistory={onViewHistory}
          onDeleteInvestment={onDeleteInvestment}
        />
      </div>
    </article>
  );
});

function InvestmentRowContent({
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
          <p className="text-xs text-slate-500">
            آخر قيد: {formatProfitPeriod(latestProfitEntry)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

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
  onEditInvestment: (investment: Investment) => void;
  onLogProfit: (investment: Investment) => void;
  onUpdateValue: (investment: Investment) => void;
  onViewHistory: (investment: Investment) => void;
  onDeleteInvestment: (investmentId: string) => void;
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
              <p className="text-xs text-slate-500">
                آخر قيد: {formatProfitPeriod(latestProfitEntry)}
              </p>
            ) : null}
            {investment.notes ? (
              <p className="text-xs text-slate-500">{investment.notes}</p>
            ) : null}
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
            <p className="font-medium text-slate-900">
              {formatDate(investment.collection_date)}
            </p>
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

function InvestmentRowActions({
  investment,
  onEditInvestment,
  onLogProfit,
  onUpdateValue,
  onViewHistory,
  onDeleteInvestment,
}: {
  investment: Investment;
  onEditInvestment: (investment: Investment) => void;
  onLogProfit: (investment: Investment) => void;
  onUpdateValue: (investment: Investment) => void;
  onViewHistory: (investment: Investment) => void;
  onDeleteInvestment: (investmentId: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <IconActionButton
        icon="🕘"
        label="سجل القيمة"
        onClick={() => onViewHistory(investment)}
        tone="slate"
      />
      {!investment.is_fixed_return ? (
        <>
          <IconActionButton
            icon="📈"
            label="تحديث القيمة"
            onClick={() => onUpdateValue(investment)}
            tone="slate"
          />
          <IconActionButton
            icon="💰"
            label="تسجيل ربح"
            onClick={() => onLogProfit(investment)}
            tone="slate"
          />
        </>
      ) : null}
      <IconActionButton
        icon="✏️"
        label="تعديل"
        onClick={() => onEditInvestment(investment)}
        tone="slate"
      />
      <IconActionButton
        icon="🗑️"
        label="حذف"
        onClick={() => onDeleteInvestment(investment.id)}
        tone="red"
      />
    </div>
  );
}
