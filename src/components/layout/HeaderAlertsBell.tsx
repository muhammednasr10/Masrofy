"use client";

import { useEffect, useRef, useState } from "react";
import AlertsDropdownPanel from "@/components/layout/AlertsDropdownPanel";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useHeaderAlerts } from "@/hooks/useHeaderAlerts";

export default function HeaderAlertsBell() {
  const t = useTranslations();
  const alerts = useHeaderAlerts();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
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
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-lg text-slate-700 transition hover:bg-slate-50"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t("alerts.title")}
      >
        <span aria-hidden>🔔</span>
        {alerts.length > 0 ? (
          <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {alerts.length > 9 ? "9+" : alerts.length}
          </span>
        ) : null}
      </button>

      {open ? <AlertsDropdownPanel alerts={alerts} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
