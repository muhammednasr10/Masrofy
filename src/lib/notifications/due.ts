import type { RecurringTransaction } from "@/lib/types/database";

const STORAGE_PREFIX = "masrofy-due-notified:";

function notifiedKey(recurring: RecurringTransaction) {
  return `${STORAGE_PREFIX}${recurring.id}:${recurring.next_due_date}`;
}

function wasNotified(recurring: RecurringTransaction) {
  try {
    return localStorage.getItem(notifiedKey(recurring)) === "1";
  } catch {
    return false;
  }
}

function markNotified(recurring: RecurringTransaction) {
  try {
    localStorage.setItem(notifiedKey(recurring), "1");
  } catch {
    // Ignore quota / private mode failures.
  }
}

export function buildDueNotificationCopy(
  recurring: RecurringTransaction,
  locale: "ar" | "en",
) {
  const isArabic = locale !== "en";
  const kind = recurring.type === "income" ? (isArabic ? "دخل" : "income") : isArabic ? "مصروف" : "expense";

  return {
    title: isArabic ? `مستحق: ${recurring.title}` : `Due: ${recurring.title}`,
    body: isArabic
      ? `${kind} متكرر — سجّله من التنبيهات أو صفحة المصروفات.`
      : `Recurring ${kind} — record it from alerts or the expenses page.`,
    tag: `due:${recurring.id}:${recurring.next_due_date}`,
  };
}

export async function notifyDueRecurringTransactions(
  recurrings: RecurringTransaction[],
  locale: "ar" | "en",
) {
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const pending = recurrings.filter((item) => !wasNotified(item));

  if (pending.length === 0) {
    return;
  }

  const registration =
    "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;

  await Promise.all(
    pending.map(async (recurring) => {
      const copy = buildDueNotificationCopy(recurring, locale);
      const options: NotificationOptions = {
        body: copy.body,
        tag: copy.tag,
        icon: "/icons/icon-192.png",
        data: { url: "/expenses" },
      };

      if (registration) {
        await registration.showNotification(copy.title, options);
      } else {
        new Notification(copy.title, options);
      }

      markNotified(recurring);
    }),
  );
}
