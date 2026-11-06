"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import {
  DEFAULT_DAILY_REMINDER,
  loadDailyReminderSettings,
  saveDailyReminderSettings,
  type DailyReminderSettings,
} from "@/lib/notifications/daily-reminder";
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
  const [reminder, setReminder] = useState<DailyReminderSettings>(DEFAULT_DAILY_REMINDER);
  const enabled = permission === "granted" && !optedOut;

  useEffect(() => {
    setPermission(getNotificationPermission());
    setOptedOut(areDueNotificationsOptedOut());
    setReminder(loadDailyReminderSettings());
  }, []);

  function updateReminder(next: DailyReminderSettings) {
    setReminder(saveDailyReminderSettings(next));
  }

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

      <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold text-slate-900">{t("account.dailyReminderTitle")}</h4>
          <button
            type="button"
            aria-pressed={reminder.enabled}
            onClick={() => updateReminder({ ...reminder, enabled: !reminder.enabled })}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              reminder.enabled ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"
            }`}
          >
            {reminder.enabled ? t("account.dailyReminderEnabled") : t("account.notificationsDisable")}
          </button>
        </div>
        <p className="text-xs text-slate-500">{t("account.dailyReminderHint")}</p>
        <label className="block space-y-1">
          <span className="text-sm text-slate-700">{t("account.dailyReminderToday")}</span>
          <input
            type="time"
            value={reminder.todayTime}
            onChange={(event) => updateReminder({ ...reminder, todayTime: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-emerald-500"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-slate-700">{t("account.dailyReminderMissed")}</span>
          <input
            type="time"
            value={reminder.missedTime}
            onChange={(event) => updateReminder({ ...reminder, missedTime: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-emerald-500"
          />
        </label>
      </div>
    </section>
  );
}
