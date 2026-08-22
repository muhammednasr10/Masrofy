import { createAdminClient } from "@/lib/supabase/admin";
import { isAuthorizedCron } from "@/lib/cron/auth";
import { sendWebPushNotification, getVapidConfig } from "@/lib/notifications/web-push";
import { buildDueNotificationCopy } from "@/lib/notifications/due";
import { getDueRecurringTransactions } from "@/lib/recurring/schedule";
import { isLocale, type Locale } from "@/i18n/config";
import type { RecurringTransaction } from "@/lib/types/database";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!getVapidConfig()) {
    return NextResponse.json({ ok: true, skipped: "vapid_not_configured", sent: 0 });
  }

  let admin;

  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ ok: true, skipped: "admin_not_configured", sent: 0 });
  }

  const { data: recurringRows, error: recurringError } = await admin
    .from("recurring_transactions")
    .select("*, categories(name, icon, color), wallets(name, icon, color)")
    .eq("is_active", true);

  if (recurringError) {
    return NextResponse.json({ error: recurringError.message }, { status: 500 });
  }

  const dueRecurrings = getDueRecurringTransactions(
    (recurringRows ?? []) as RecurringTransaction[],
  );

  if (dueRecurrings.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const userIds = [...new Set(dueRecurrings.map((item) => item.user_id))];
  const [{ data: subscriptions }, { data: profiles }, { data: alreadySent }] = await Promise.all([
    admin.from("push_subscriptions").select("user_id, endpoint, p256dh, auth").in("user_id", userIds),
    admin.from("profiles").select("id, locale").in("id", userIds),
    admin
      .from("due_push_log")
      .select("user_id, recurring_id, due_date")
      .in(
        "recurring_id",
        dueRecurrings.map((item) => item.id),
      ),
  ]);

  const localeByUser = new Map<string, Locale>(
    (profiles ?? []).map((row) => [
      String(row.id),
      isLocale(row.locale) ? row.locale : "ar",
    ]),
  );
  const sentKeys = new Set(
    (alreadySent ?? []).map((row) => `${row.user_id}:${row.recurring_id}:${row.due_date}`),
  );
  const subscriptionsByUser = new Map<string, Array<{ endpoint: string; p256dh: string; auth: string }>>();

  for (const row of subscriptions ?? []) {
    const current = subscriptionsByUser.get(row.user_id) ?? [];
    current.push({ endpoint: row.endpoint, p256dh: row.p256dh, auth: row.auth });
    subscriptionsByUser.set(row.user_id, current);
  }

  let sent = 0;

  for (const recurring of dueRecurrings) {
    const logKey = `${recurring.user_id}:${recurring.id}:${recurring.next_due_date}`;

    if (sentKeys.has(logKey)) {
      continue;
    }

    const userSubscriptions = subscriptionsByUser.get(recurring.user_id) ?? [];

    if (userSubscriptions.length === 0) {
      continue;
    }

    const locale: Locale = localeByUser.get(recurring.user_id) ?? "ar";
    const copy = buildDueNotificationCopy(recurring, locale);
    let delivered = false;

    for (const subscription of userSubscriptions) {
      const result = await sendWebPushNotification(subscription, {
        title: copy.title,
        body: copy.body,
        url: "/expenses",
        tag: copy.tag,
      });

      if (result.gone) {
        await admin.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
      }

      if (result.ok) {
        delivered = true;
      }
    }

    if (delivered) {
      await admin.from("due_push_log").upsert({
        user_id: recurring.user_id,
        recurring_id: recurring.id,
        due_date: recurring.next_due_date,
      });
      sent += 1;
    }
  }

  return NextResponse.json({ ok: true, sent, due: dueRecurrings.length });
}
