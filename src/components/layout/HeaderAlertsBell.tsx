"use client";

import { useEffect, useRef } from "react";
import { useAlerts } from "@/components/alerts/AlertsProvider";
import AlertsDropdownPanel from "@/components/layout/AlertsDropdownPanel";
import { useTranslations } from "@/components/i18n/LocaleProvider";

export default function HeaderAlertsBell() {
  const t = useTranslations();
  const {
    alerts,
    dueRecurrings,
    duePlanLines,
    currency,
    walletNames,
    actingId,
    actionError,
    totalCount,
    panelSource,
    togglePanel,
    closePanel,
    registerDue,
    skipDue,
    confirmPlanDue,
    dismissPlanDue,
  } = useAlerts();
  const containerRef = useRef<HTMLDivElement>(null);
  const panelOpen = panelSource === "header";

  useEffect(() => {
    if (!panelOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current?.contains(event.target as Node)) {
        return;
      }

      closePanel();
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePanel();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [closePanel, panelOpen]);

  return (
    <div ref={containerRef} className="relative z-[100]">
      <button
        type="button"
        onClick={() => togglePanel("header")}
        className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-lg text-slate-700 transition hover:bg-slate-50"
        aria-expanded={panelOpen}
        aria-haspopup="true"
        aria-label={t("alerts.title")}
      >
        <span aria-hidden>🔔</span>
        {totalCount > 0 ? (
          <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        ) : null}
      </button>

      {panelOpen ? (
        <AlertsDropdownPanel
          alerts={alerts}
          dueRecurrings={dueRecurrings}
          duePlanLines={duePlanLines}
          currency={currency}
          walletNames={walletNames}
          actingId={actingId}
          actionError={actionError}
          onRegisterDue={(recurring) => void registerDue(recurring)}
          onSkipDue={(recurring) => void skipDue(recurring)}
          onConfirmPlanDue={(line) => void confirmPlanDue(line)}
          onDismissPlanDue={(line) => void dismissPlanDue(line)}
          onClose={closePanel}
          placement="header"
        />
      ) : null}
    </div>
  );
}
