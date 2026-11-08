"use client";

import { useEffect, useRef, useState } from "react";
import { useAlerts } from "@/components/alerts/AlertsProvider";
import DuePlanAlertsList from "@/components/layout/DuePlanAlertsList";
import { useTranslations } from "@/components/i18n/LocaleProvider";

export default function PlanDueReminderButton() {
  const t = useTranslations();
  const {
    duePlanLines,
    currency,
    walletNames,
    actingId,
    actionError,
    confirmPlanDue,
    dismissPlanDue,
  } = useAlerts();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const unpaidPlanExpenses = duePlanLines.filter((line) => line.flow === "expense");
  const count = unpaidPlanExpenses.length;

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current?.contains(event.target as Node)) {
        return;
      }

      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (count === 0) {
      setOpen(false);
    }
  }, [count]);

  if (count === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t("alerts.planDueToolbarLabel", { count: String(count) })}
        title={t("alerts.planDueToolbarLabel", { count: String(count) })}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-base text-amber-800 transition hover:bg-amber-100"
      >
        <span aria-hidden>📅</span>
        <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-600 px-1 text-[9px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[90] bg-slate-900/20"
            onClick={() => setOpen(false)}
            aria-label={t("common.close")}
          />
          <div
            className="absolute end-0 top-[calc(100%+0.5rem)] z-[100] w-[min(22rem,calc(100vw-2rem))] max-h-[min(24rem,calc(100dvh-8rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
            role="dialog"
            aria-label={t("alerts.planDueSectionTitle")}
          >
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">
                {t("alerts.planDueSectionTitle")} ({count})
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{t("alerts.planDueSectionDesc")}</p>
            </div>

            <DuePlanAlertsList
              duePlanLines={unpaidPlanExpenses}
              currency={currency}
              walletNames={walletNames}
              actingId={actingId}
              onConfirm={(line) => void confirmPlanDue(line)}
              onDismiss={(line) => void dismissPlanDue(line)}
              hideHeader
            />

            {actionError ? (
              <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
                {actionError}
              </p>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
