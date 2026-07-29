"use client";

import Link from "next/link";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { DashboardAlert } from "@/lib/alerts/dashboard";

const toneClasses = {
  red: "border-red-200 bg-red-50 text-red-800 hover:bg-red-100",
  amber: "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-100",
};

type AlertsDropdownPanelProps = {
  alerts: DashboardAlert[];
  onClose: () => void;
};

export default function AlertsDropdownPanel({ alerts, onClose }: AlertsDropdownPanelProps) {
  const t = useTranslations();

  return (
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
                onClick={onClose}
                className={`flex items-start gap-3 rounded-xl border px-3 py-3 transition ${toneClasses[alert.tone]}`}
              >
                <span className="text-lg">{alert.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{alert.title}</span>
                  <span className="mt-0.5 block text-xs opacity-80">{alert.description}</span>
                  <span className="mt-1 block text-xs font-medium underline underline-offset-2">
                    {alert.actionLabel}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
