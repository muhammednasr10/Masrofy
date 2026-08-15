"use client";

import { useState } from "react";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import {
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPushNotifications,
} from "@/lib/notifications/permission";
import { setDueNotificationsOptOut } from "@/hooks/useDueRecurringNotifications";

export default function DueNotificationPrompt({ dueCount }: { dueCount: number }) {
  const t = useTranslations();
  const [permission, setPermission] = useState(getNotificationPermission);
  const [busy, setBusy] = useState(false);

  if (dueCount === 0 || permission !== "default") {
    return null;
  }

  async function handleEnable() {
    setBusy(true);
    const nextPermission = await requestNotificationPermission();
    setPermission(nextPermission);
    setDueNotificationsOptOut(false);

    if (nextPermission === "granted") {
      await subscribeToPushNotifications();
    }

    setBusy(false);
  }

  return (
    <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3">
      <p className="text-xs text-emerald-900">{t("alerts.enableNotificationsHint")}</p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleEnable()}
        className="mt-2 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {t("alerts.enableNotifications")}
      </button>
    </div>
  );
}
