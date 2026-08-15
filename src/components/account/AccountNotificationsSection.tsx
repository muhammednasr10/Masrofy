"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import {
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from "@/lib/notifications/permission";
import {
  areDueNotificationsOptedOut,
  setDueNotificationsOptOut,
} from "@/hooks/useDueRecurringNotifications";

export default function AccountNotificationsSection() {
  const t = useTranslations();
  const [permission, setPermission] = useState<ReturnType<typeof getNotificationPermission>>("unsupported");
  const [optedOut, setOptedOut] = useState(false);
  const [busy, setBusy] = useState(false);
  const enabled = permission === "granted" && !optedOut;

  useEffect(() => {
    setPermission(getNotificationPermission());
    setOptedOut(areDueNotificationsOptedOut());
  }, []);

  async function handleEnable() {
    setBusy(true);
    const nextPermission = await requestNotificationPermission();
    setPermission(nextPermission);
    setDueNotificationsOptOut(false);
    setOptedOut(false);

    if (nextPermission === "granted") {
      await subscribeToPushNotifications();
    }

    setBusy(false);
  }

  async function handleDisable() {
    setBusy(true);
    setDueNotificationsOptOut(true);
    setOptedOut(true);
    await unsubscribeFromPushNotifications();
    setBusy(false);
  }

  return (
    <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{t("account.notificationsTitle")}</h3>
      <p className="mt-2 text-sm text-slate-500">{t("account.notificationsSubtitle")}</p>

      {permission === "unsupported" ? (
        <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {t("account.notificationsUnsupported")}
        </p>
      ) : permission === "denied" ? (
        <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t("account.notificationsBlocked")}
        </p>
      ) : enabled ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-sm text-emerald-700">{t("account.notificationsEnabled")}</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleDisable()}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {t("account.notificationsDisable")}
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleEnable()}
          className="mt-4 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {t("account.notificationsEnable")}
        </button>
      )}
    </section>
  );
}
