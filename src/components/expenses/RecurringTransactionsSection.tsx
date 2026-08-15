"use client";

import { useTranslations } from "@/components/i18n/LocaleProvider";
import IconActionButton from "@/components/ui/IconActionButton";
import ModalShell from "@/components/ui/ModalShell";
import { getFrequencyLabel } from "@/lib/recurring";
import type { RecurringTransaction } from "@/lib/types/database";
import { formatCurrency, formatDate } from "@/lib/utils/format";

type RecurringTransactionsSectionProps = {
  open: boolean;
  recurrings: RecurringTransaction[];
  currency: string;
  actingId?: string | null;
  onRegisterDue: (recurring: RecurringTransaction) => void;
  onEdit: (recurring: RecurringTransaction) => void;
  onToggleActive: (recurring: RecurringTransaction) => void;
  onDelete: (id: string) => void;
  onOpenAdd: () => void;
  onClose: () => void;
};

export default function RecurringTransactionsSection({
  open,
  recurrings,
  currency,
  actingId = null,
  onRegisterDue,
  onEdit,
  onToggleActive,
  onDelete,
  onOpenAdd,
  onClose,
}: RecurringTransactionsSectionProps) {
  const t = useTranslations();
  const isActing = (id: string) => actingId === id;

  if (!open) {
    return null;
  }

  return (
    <ModalShell onClose={onClose} maxWidthClassName="sm:max-w-2xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t("expenses.recurringPanelTitle")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("expenses.recurringPanelDesc")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenAdd}
            className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            + {t("expenses.recurringAddInside")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-slate-500 transition hover:bg-slate-100"
          >
            {t("common.close")}
          </button>
        </div>
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
                    {recurring.type === "expense" ? t("expenses.typeExpense") : t("expenses.typeIncome")}{" "}
                    • {getFrequencyLabel(recurring.frequency)} •{" "}
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

                <div className="flex shrink-0 items-center gap-1 self-end sm:self-start">
                  {recurring.is_active ? (
                    <IconActionButton
                      icon="✓"
                      label={t("expenses.recurringMarkDone")}
                      tone="emerald"
                      disabled={isActing(recurring.id)}
                      onClick={() => onRegisterDue(recurring)}
                    />
                  ) : null}
                  <IconActionButton
                    icon="✏️"
                    label={t("expenses.recurringEdit")}
                    disabled={isActing(recurring.id)}
                    onClick={() => onEdit(recurring)}
                  />
                  <IconActionButton
                    icon={recurring.is_active ? "⏸" : "▶"}
                    label={
                      recurring.is_active
                        ? t("expenses.recurringPause")
                        : t("expenses.recurringResume")
                    }
                    tone="amber"
                    disabled={isActing(recurring.id)}
                    onClick={() => onToggleActive(recurring)}
                  />
                  <IconActionButton
                    icon="🗑"
                    label={t("expenses.recurringDelete")}
                    tone="red"
                    disabled={isActing(recurring.id)}
                    onClick={() => onDelete(recurring.id)}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </ModalShell>
  );
}
