"use client";

import { useEffect, useRef, useState } from "react";
import AlertsDropdownPanel from "@/components/layout/AlertsDropdownPanel";
import { useTranslations, useLocale } from "@/components/i18n/LocaleProvider";
import { useDueRecurringNotifications } from "@/hooks/useDueRecurringNotifications";
import { useHeaderAlerts } from "@/hooks/useHeaderAlerts";

export default function HeaderAlertsBell() {
  const t = useTranslations();
  const { locale } = useLocale();
  const {
    alerts,
    dueRecurrings,
    currency,
    actingId,
    actionError,
    totalCount,
    registerDue,
    skipDue,
  } = useHeaderAlerts();
  useDueRecurringNotifications(dueRecurrings, locale);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={containerRef} className="relative z-[100]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-lg text-slate-700 transition hover:bg-slate-50"
        aria-expanded={open}
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

      {open ? (
        <AlertsDropdownPanel
          alerts={alerts}
          dueRecurrings={dueRecurrings}
          currency={currency}
          actingId={actingId}
          actionError={actionError}
          onRegisterDue={registerDue}
          onSkipDue={skipDue}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}
