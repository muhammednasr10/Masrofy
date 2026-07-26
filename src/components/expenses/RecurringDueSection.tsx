"use client";

import type { RecurringTransaction } from "@/lib/types/database";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import {
  getDueStatusLabel,
  getFrequencyLabel,
  isRecurringOverdue,
} from "@/lib/recurring";

type RecurringDueSectionProps = {
  dueRecurrings: RecurringTransaction[];
  currency: string;
  actingId: string | null;
  onRegister: (recurring: RecurringTransaction) => void;
  onSkip: (recurring: RecurringTransaction) => void;
};

export default function RecurringDueSection({
  dueRecurrings,
  currency,
  actingId,
  onRegister,
  onSkip,
}: RecurringDueSectionProps) {
  if (dueRecurrings.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm sm:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-amber-900">عمليات مستحقة ({dueRecurrings.length})</h2>
        <p className="mt-1 text-sm text-amber-800">
          سجّل العملية في حسابك أو أجّلها للموعد التالي.
        </p>
      </div>

      <div className="space-y-3">
        {dueRecurrings.map((recurring) => {
          const overdue = isRecurringOverdue(recurring);
          const statusLabel = getDueStatusLabel(recurring);

          return (
            <article
              key={recurring.id}
              className="rounded-2xl border border-white bg-white/90 p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{recurring.title}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        overdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {recurring.type === "expense" ? "مصروف" : "دخل"} •{" "}
                    {getFrequencyLabel(recurring.frequency)} •{" "}
                    {formatCurrency(Number(recurring.amount), currency)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {recurring.wallets?.icon} {recurring.wallets?.name ?? "—"}
                    {recurring.categories ? ` • ${recurring.categories.icon} ${recurring.categories.name}` : ""}
                    {" • "}مستحق: {formatDate(recurring.next_due_date)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={actingId === recurring.id}
                    onClick={() => onRegister(recurring)}
                    className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {actingId === recurring.id ? "..." : "تسجيل"}
                  </button>
                  <button
                    type="button"
                    disabled={actingId === recurring.id}
                    onClick={() => onSkip(recurring)}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    تأجيل
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
