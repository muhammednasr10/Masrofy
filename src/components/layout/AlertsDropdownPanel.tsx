"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import DueNotificationPrompt from "@/components/layout/DueNotificationPrompt";
import DueRecurringAlertsList from "@/components/layout/DueRecurringAlertsList";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { DashboardAlert } from "@/lib/alerts/dashboard";
import type { RecurringTransaction } from "@/lib/types/database";

const toneClasses = {
  red: "border-red-200 bg-red-50 text-red-800 hover:bg-red-100",
  amber: "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-100",
};

type AlertsDropdownPanelProps = {
  alerts: DashboardAlert[];
  dueRecurrings: RecurringTransaction[];
  currency: string;
  actingId: string | null;
  actionError: string | null;
  anchorRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  onRegisterDue: (recurring: RecurringTransaction) => void;
  onSkipDue: (recurring: RecurringTransaction) => void;
  onClose: () => void;
};

function getPanelStyle(anchor: HTMLElement) {
  const rect = anchor.getBoundingClientRect();
  const gutter = 8;
  const width = Math.min(384, window.innerWidth - gutter * 2);
  const left = Math.min(
    Math.max(gutter, rect.right - width),
    window.innerWidth - width - gutter,
  );

  return {
    top: "max(0.5rem, env(safe-area-inset-top, 0px))",
    left,
    width,
    maxHeight: "calc(100dvh - 1rem - env(safe-area-inset-top, 0px))",
  };
}

export default function AlertsDropdownPanel({
  alerts,
  dueRecurrings,
  currency,
  actingId,
  actionError,
  anchorRef,
  panelRef,
  onRegisterDue,
  onSkipDue,
  onClose,
}: AlertsDropdownPanelProps) {
  const t = useTranslations();
  const totalCount = alerts.length + dueRecurrings.length;
  const [style, setStyle] = useState({
    top: 8 as number | string,
    left: 8 as number,
    width: 320 as number,
    maxHeight: "90dvh" as string,
  });

  useLayoutEffect(() => {
    function updatePosition() {
      if (anchorRef.current) {
        setStyle(getPanelStyle(anchorRef.current));
      }
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
    };
  }, [anchorRef]);

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[90] bg-slate-900/25"
        onClick={onClose}
        aria-label={t("common.close")}
      />
      <div
        ref={panelRef}
        style={style}
        className="fixed z-[100] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
        role="menu"
      >
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">
            {t("alerts.title")}
            {totalCount > 0 ? ` (${totalCount})` : ""}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{t("alerts.subtitle")}</p>
        </div>

        <DueNotificationPrompt dueCount={dueRecurrings.length} />

        <DueRecurringAlertsList
          dueRecurrings={dueRecurrings}
          currency={currency}
          actingId={actingId}
          onRegister={onRegisterDue}
          onSkip={onSkipDue}
        />

        {actionError ? (
          <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
            {actionError === "already_registered"
              ? t("alerts.alreadyRegistered")
              : actionError === "auth_required"
                ? t("alerts.authRequired")
                : actionError}
          </p>
        ) : null}

        {alerts.length === 0 && dueRecurrings.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">{t("alerts.empty")}</p>
        ) : alerts.length > 0 ? (
          <ul className="space-y-2 p-3">
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
        ) : null}
      </div>
    </>,
    document.body,
  );
}
