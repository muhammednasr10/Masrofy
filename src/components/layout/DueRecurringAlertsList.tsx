"use client";

import { useTranslations } from "@/components/i18n/LocaleProvider";
import IconActionButton from "@/components/ui/IconActionButton";
import { useFormat } from "@/hooks/useFormat";
import {
  getDueStatusLabel,
  getFrequencyLabel,
  isRecurringOverdue,
} from "@/lib/recurring/schedule";
import type { RecurringTransaction } from "@/lib/types/database";

type DueRecurringAlertsListProps = {
  dueRecurrings: RecurringTransaction[];
  currency: string;
  actingId: string | null;
  onRegister: (recurring: RecurringTransaction) => void;
  onSkip: (recurring: RecurringTransaction) => void;
};

export default function DueRecurringAlertsList({
  dueRecurrings,
  currency,
  actingId,
  onRegister,
  onSkip,
}: DueRecurringAlertsListProps) {
  const t = useTranslations();
  const { formatCurrency, formatDate } = useFormat();

  if (dueRecurrings.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-amber-100 bg-amber-50/60 p-3">
      <div className="mb-3 px-1">
        <p className="text-sm font-semibold text-amber-900">
          {t("alerts.dueSectionTitle")} ({dueRecurrings.length})
        </p>
        <p className="mt-0.5 text-xs text-amber-800">{t("alerts.dueSectionDesc")}</p>
      </div>

      <ul className="space-y-2">
        {dueRecurrings.map((recurring) => {
          const overdue = isRecurringOverdue(recurring);
          const statusLabel = getDueStatusLabel(recurring);

          return (
            <li
              key={recurring.id}
              className="rounded-xl border border-white bg-white p-3 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 flex-1 text-sm font-semibold text-slate-900">
                  {recurring.title}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    overdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {statusLabel}
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-600">
                {recurring.type === "expense" ? t("expenses.typeExpense") : t("expenses.typeIncome")}{" "}
                • {getFrequencyLabel(recurring.frequency)} •{" "}
                {formatCurrency(Number(recurring.amount), currency)}
              </p>

              <p className="mt-1 text-[11px] text-slate-500">
                {recurring.wallets?.icon} {recurring.wallets?.name ?? "—"}
                {recurring.categories
                  ? ` • ${recurring.categories.icon} ${recurring.categories.name}`
                  : ""}
                {" • "}
                {t("alerts.dueOn", { date: formatDate(recurring.next_due_date) })}
              </p>

              <div className="mt-3 flex items-center gap-1">
                <IconActionButton
                  icon="✓"
                  label={t("alerts.registerDue")}
                  tone="emerald"
                  disabled={actingId === recurring.id}
                  onClick={() => onRegister(recurring)}
                />
                <IconActionButton
                  icon="⏭"
                  label={t("alerts.postponeDue")}
                  tone="slate"
                  disabled={actingId === recurring.id}
                  onClick={() => onSkip(recurring)}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
