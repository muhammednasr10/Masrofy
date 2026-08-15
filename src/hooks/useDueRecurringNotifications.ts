"use client";

import { useEffect } from "react";
import { notifyDueRecurringTransactions } from "@/lib/notifications/due";
import { subscribeToPushNotifications } from "@/lib/notifications/permission";
import type { RecurringTransaction } from "@/lib/types/database";

const OPT_OUT_KEY = "masrofy-due-notifications";

export function areDueNotificationsOptedOut() {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === "off";
  } catch {
    return false;
  }
}

export function setDueNotificationsOptOut(optOut: boolean) {
  try {
    localStorage.setItem(OPT_OUT_KEY, optOut ? "off" : "on");
  } catch {
    // Ignore storage failures.
  }
}

export function useDueRecurringNotifications(
  dueRecurrings: RecurringTransaction[],
  locale: "ar" | "en",
) {
  useEffect(() => {
    if (dueRecurrings.length === 0 || areDueNotificationsOptedOut()) {
      return;
    }

    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    void notifyDueRecurringTransactions(dueRecurrings, locale);
    void subscribeToPushNotifications();
  }, [dueRecurrings, locale]);
}
