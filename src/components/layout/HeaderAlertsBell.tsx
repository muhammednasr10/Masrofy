"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { DashboardAlert } from "@/lib/alerts/dashboard";

const toneClasses = {
  red: "border-red-200 bg-red-50 text-red-800 hover:bg-red-100",
  amber: "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-100",
};

export default function HeaderAlertsBell() {
  const t = useTranslations();
  const pathname = usePathname();
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAlerts() {
      try {
        const response = await fetch("/api/alerts", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { alerts?: DashboardAlert[] };
        if (!cancelled) {
          setAlerts(payload.alerts ?? []);
        }
      } catch {
        // Ignore alert fetch failures in the header.
      }
    }

    void loadAlerts();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

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

      {open ? (
        <div className="absolute end-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">
              {t("alerts.title")}
              {alerts.length > 0 ? ` (${alerts.length})` : ""}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{t("alerts.subtitle")}</p>
          </div>

          {alerts.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">{t("alerts.empty")}</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto p-3">
              {alerts.map((alert) => (
                <li key={alert.id}>
                  <Link
                    href={alert.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-start gap-3 rounded-xl border px-3 py-3 transition ${toneClasses[alert.tone]}`}
                  >
                    <span className="text-lg">{alert.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{alert.title}</span>
                      <span className="mt-0.5 block text-xs opacity-80">{alert.description}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
