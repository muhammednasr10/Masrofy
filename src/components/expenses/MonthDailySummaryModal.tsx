"use client";

import ModalShell from "@/components/ui/ModalShell";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useFormat } from "@/hooks/useFormat";
import { formatLocalDate } from "@/lib/calendar";
import { buildDailyMonthSummary } from "@/lib/expenses/daily-month-summary";
import type { OfflineTransaction } from "@/lib/offline/types";
import { useLayoutEffect, useMemo, useRef } from "react";

type MonthDailySummaryModalProps = {
  transactions: OfflineTransaction[];
  monthStart: string;
  monthEnd: string;
  currency: string;
  onClose: () => void;
};

export default function MonthDailySummaryModal({
  transactions,
  monthStart,
  monthEnd,
  currency,
  onClose,
}: MonthDailySummaryModalProps) {
  const t = useTranslations();
  const { formatCurrency, formatDate } = useFormat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRowRef = useRef<HTMLTableRowElement>(null);
  const summary = useMemo(
    () => buildDailyMonthSummary(transactions, monthStart, monthEnd),
    [monthEnd, monthStart, transactions],
  );
  const todayKey = useMemo(() => formatLocalDate(new Date()), []);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    const row = todayRowRef.current;

    if (!container || !row) {
      return;
    }

    // Place today's row in the lower third of the visible list.
    const rowTop = row.getBoundingClientRect().top;
    const containerTop = container.getBoundingClientRect().top;
    const delta = rowTop - containerTop + container.scrollTop;
    const target = delta - container.clientHeight * (2 / 3);
    container.scrollTop = Math.max(0, target);
  }, [summary.days, todayKey]);

  return (
    <ModalShell onClose={onClose} maxWidthClassName="sm:max-w-2xl" dialog>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {t("expenses.dailySummaryTitle")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t("expenses.dailySummarySubtitle", {
              from: formatDate(monthStart),
              to: formatDate(monthEnd),
            })}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-3 py-1 text-sm text-slate-500 transition hover:bg-slate-100"
        >
          {t("common.close")}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
        <SummaryChip
          label={t("expenses.dailySummaryTotalIncome")}
          value={formatCurrency(summary.totalIncome, currency)}
          tone="income"
        />
        <SummaryChip
          label={t("expenses.dailySummaryTotalExpense")}
          value={formatCurrency(summary.totalExpense, currency)}
          tone="expense"
        />
        <SummaryChip
          label={t("expenses.dailySummaryTotalNet")}
          value={formatCurrency(summary.totalNet, currency)}
          tone={summary.totalNet >= 0 ? "income" : "expense"}
        />
      </div>

      <div
        ref={scrollRef}
        className="mt-5 max-h-[min(60vh,28rem)] overflow-y-auto rounded-2xl border border-slate-100"
      >
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2.5 text-start font-medium">
                {t("expenses.tableDate")}
              </th>
              <th className="px-3 py-2.5 text-start font-medium">
                {t("expenses.typeIncome")}
              </th>
              <th className="px-3 py-2.5 text-start font-medium">
                {t("expenses.typeExpense")}
              </th>
              <th className="px-3 py-2.5 text-start font-medium">
                {t("expenses.dailySummaryNet")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {summary.days.map((day) => {
              const isToday = day.date === todayKey;

              return (
              <tr
                key={day.date}
                ref={isToday ? todayRowRef : undefined}
                className={
                  isToday
                    ? "bg-amber-50 ring-1 ring-inset ring-amber-200"
                    : "hover:bg-slate-50/80"
                }
              >
                <td
                  className={`whitespace-nowrap px-3 py-2.5 ${
                    isToday ? "font-semibold text-amber-950" : "text-slate-700"
                  }`}
                >
                  {formatDate(day.date)}
                  {isToday ? (
                    <span className="ms-2 rounded-full bg-amber-200/80 px-1.5 py-0.5 text-[10px] font-medium text-amber-900">
                      {t("expenses.dailySummaryToday")}
                    </span>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-medium text-emerald-600">
                  {formatCurrency(day.income, currency)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-medium text-red-600">
                  {formatCurrency(day.expense, currency)}
                </td>
                <td
                  className={`whitespace-nowrap px-3 py-2.5 font-semibold ${
                    day.net >= 0 ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {formatCurrency(day.net, currency)}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ModalShell>
  );
}

function SummaryChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "income" | "expense";
}) {
  const toneClass =
    tone === "income"
      ? "bg-emerald-50 text-emerald-800"
      : "bg-red-50 text-red-800";

  return (
    <div className={`rounded-2xl px-3 py-3 ${toneClass}`}>
      <p className="text-[11px] opacity-80 sm:text-xs">{label}</p>
      <p className="mt-1 text-sm font-semibold sm:text-base">{value}</p>
    </div>
  );
}
