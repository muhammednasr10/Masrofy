"use client";

import { useLocale, useTranslations } from "@/components/i18n/LocaleProvider";
import { useFormat } from "@/hooks/useFormat";
import type { DuePlanLine } from "@/lib/plan/expected-day";

type DuePlanAlertsListProps = {
  duePlanLines: DuePlanLine[];
  currency: string;
  walletNames: Record<string, string>;
  actingId: string | null;
  onConfirm: (line: DuePlanLine) => void;
  onDismiss: (line: DuePlanLine) => void;
  /** Hide the section title when the parent already shows one. */
  hideHeader?: boolean;
};

export default function DuePlanAlertsList({
  duePlanLines,
  currency,
  walletNames,
  actingId,
  onConfirm,
  onDismiss,
  hideHeader = false,
}: DuePlanAlertsListProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const { formatCurrency, formatDate } = useFormat();
  const isArabic = locale !== "en";

  if (duePlanLines.length === 0) {
    return null;
  }

  return (
    <section className={hideHeader ? "p-3" : "border-b border-emerald-100 bg-emerald-50/70 p-3"}>
      {hideHeader ? null : (
        <div className="mb-3 px-1">
          <p className="text-sm font-semibold text-emerald-950">
            {t("alerts.planDueSectionTitle")} ({duePlanLines.length})
          </p>
          <p className="mt-0.5 text-xs text-emerald-900">{t("alerts.planDueSectionDesc")}</p>
        </div>
      )}

      <ul className="space-y-2">
        {duePlanLines.map((line) => {
          const walletName =
            (line.walletId && walletNames[line.walletId]) || t("alerts.planDueDefaultWallet");
          const walletEffect =
            line.flow === "income"
              ? t("alerts.planDueCreditWallet", { wallet: walletName })
              : t("alerts.planDueDebitWallet", { wallet: walletName });

          return (
            <li key={line.answerId} className="rounded-xl border border-white bg-white p-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 flex-1 text-sm font-semibold text-slate-900">{line.name}</p>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                  {line.flow === "income" ? t("expenses.typeIncome") : t("expenses.typeExpense")}
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-600">{formatCurrency(line.amount, currency)}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                {t("alerts.dueOn", { date: formatDate(line.dueDate) })}
                {" • "}
                {walletEffect}
              </p>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={actingId != null}
                  onClick={() => onConfirm(line)}
                  className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isArabic ? "آه" : "Yes"}
                </button>
                <button
                  type="button"
                  disabled={actingId != null}
                  onClick={() => onDismiss(line)}
                  className="rounded-xl bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  {isArabic ? "لأ" : "No"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
