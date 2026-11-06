"use client";

import { useEffect } from "react";
import type { Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/client";
import {
  isReminderDue,
  loadDailyReminderSent,
  loadDailyReminderSettings,
  localDateKey,
  previousLocalDateKey,
  saveDailyReminderSent,
} from "@/lib/notifications/daily-reminder";

async function showDailyNotification(title: string, body: string, tag: string) {
  const options: NotificationOptions = {
    body,
    tag,
    icon: "/icons/icon-192.png",
    data: { url: "/expenses" },
  };
  const registration =
    "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;

  if (registration) {
    await registration.showNotification(title, options);
    return;
  }

  new Notification(title, options);
}

async function yesterdayHasNoExpenses(yesterday: string) {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("type", "expense")
    .eq("transaction_date", yesterday);

  if (error || count === null) {
    return null;
  }

  return count === 0;
}

export function useDailySpendReminder(locale: Locale) {
  useEffect(() => {
    let running = false;

    async function tick() {
      if (running || typeof window === "undefined" || !("Notification" in window)) {
        return;
      }

      if (Notification.permission !== "granted") {
        return;
      }

      const settings = loadDailyReminderSettings();

      if (!settings.enabled) {
        return;
      }

      running = true;

      try {
        const now = new Date();
        const today = localDateKey(now);
        const sent = loadDailyReminderSent();
        const isArabic = locale !== "en";
        const title = "Masrofy";

        if (isReminderDue(now, settings.todayTime, sent.today)) {
          await showDailyNotification(
            title,
            isArabic ? "انت صرفت إيه النهاردة؟" : "What did you spend today?",
            `daily-spend:${today}`,
          );
          saveDailyReminderSent({ ...loadDailyReminderSent(), today });
        }

        if (isReminderDue(now, settings.missedTime, loadDailyReminderSent().missed)) {
          const empty = await yesterdayHasNoExpenses(previousLocalDateKey(now));

          if (empty === null) {
            return;
          }

          if (empty) {
            await showDailyNotification(
              title,
              isArabic ? "انت مسجلتش أى مصاريف أمس" : "You didn't record any expenses yesterday",
              `daily-missed:${today}`,
            );
          }

          saveDailyReminderSent({ ...loadDailyReminderSent(), missed: today });
        }
      } finally {
        running = false;
      }
    }

    void tick();
    const timer = window.setInterval(() => {
      void tick();
    }, 30_000);

    return () => window.clearInterval(timer);
  }, [locale]);
}
