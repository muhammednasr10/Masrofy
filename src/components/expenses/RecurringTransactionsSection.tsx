"use client";

import type { RecurringTransaction } from "@/lib/types/database";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { getFrequencyLabel } from "@/lib/recurring";

type RecurringTransactionsSectionProps = {
  recurrings: RecurringTransaction[];
  currency: string;
  onToggleActive: (recurring: RecurringTransaction) => void;
  onDelete: (id: string) => void;
  onOpenAdd?: () => void;
  showAddButton?: boolean;
};

export default function RecurringTransactionsSection({
  recurrings,
  currency,
  onToggleActive,
  onDelete,
  onOpenAdd,
  showAddButton = false,
}: RecurringTransactionsSectionProps) {
  return (
    <section className="rounded-3xl border border-white bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">العمليات المتكررة</h2>
          <p className="mt-1 text-sm text-slate-500">
            إيجار، اشتراكات، راتب — تُذكّرك تلقائيًا عند موعدها.
          </p>
        </div>
        {showAddButton && onOpenAdd ? (
          <button
            type="button"
            onClick={onOpenAdd}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            + إضافة متكررة
          </button>
        ) : null}
      </div>

      {recurrings.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">لا توجد عمليات متكررة بعد.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {recurrings.map((recurring) => (
            <article
              key={recurring.id}
              className={`rounded-2xl border p-4 ${
                recurring.is_active
                  ? "border-slate-100 bg-slate-50"
                  : "border-slate-100 bg-slate-50/60 opacity-70"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{recurring.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {recurring.type === "expense" ? "مصروف" : "دخل"} •{" "}
                    {getFrequencyLabel(recurring.frequency)} •{" "}
                    {formatCurrency(Number(recurring.amount), currency)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {recurring.wallets?.icon} {recurring.wallets?.name ?? "—"}
                    {recurring.categories
                      ? ` • ${recurring.categories.icon} ${recurring.categories.name}`
                      : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    الموعد القادم: {formatDate(recurring.next_due_date)}
                    {recurring.end_date ? ` • ينتهي ${formatDate(recurring.end_date)}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleActive(recurring)}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-white"
                  >
                    {recurring.is_active ? "إيقاف" : "تفعيل"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(recurring.id)}
                    className="rounded-2xl border border-red-100 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
