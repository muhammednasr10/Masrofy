import { createClient } from "@supabase/supabase-js";
import { sendAdminEmail, escapeHtml, plainNotificationText } from "@/lib/admin/email";
import { isAuthorizedCron } from "@/lib/cron/auth";
import { isLocale, type Locale } from "@/i18n/config";
import { sendWebPushNotification, getVapidConfig } from "@/lib/notifications/web-push";
import { buildDueNotificationCopy } from "@/lib/notifications/due";
import { getDueRecurringTransactions } from "@/lib/recurring/schedule";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { getSiteUrl } from "@/lib/supabase/site-url";
import type { RecurringTransaction } from "@/lib/types/database";

async function getRequestUser(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";

  if (!token) {
    return null;
  }

  const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return { supabase, user: data.user };
}

async function handleDeleteAccount(request: Request) {
  try {
    const auth = await getRequestUser(request);

    if (!auth) {
      return Response.json({ error: "يجب تسجيل الدخول أولاً." }, { status: 401 });
    }

    const admin = createAdminClient();
    const { error: deleteError } = await admin.auth.admin.deleteUser(auth.user.id);

    if (deleteError) {
      return Response.json({ error: deleteError.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر حذف الحساب.";
    return Response.json({ error: message }, { status: 500 });
  }
}

async function handleNotifyCategorySuggestion(request: Request) {
  const auth = await getRequestUser(request);

  if (!auth) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { categoryId?: string } | null;
  const categoryId = body?.categoryId?.trim() ?? "";

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(categoryId)) {
    return Response.json({ error: "missing_category" }, { status: 400 });
  }

  const { data: suggestion } = await auth.supabase
    .from("category_suggestions")
    .select("id, name, icon, parent_name, status")
    .eq("category_id", categoryId)
    .eq("user_id", auth.user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (!suggestion) {
    return Response.json({ ok: true, skipped: true });
  }

  const rawName = plainNotificationText(String(suggestion.name ?? ""));
  const rawIcon = plainNotificationText(String(suggestion.icon ?? ""));
  const rawParent = suggestion.parent_name
    ? plainNotificationText(String(suggestion.parent_name))
    : "";
  const name = escapeHtml(rawName);
  const icon = escapeHtml(rawIcon);
  const parentLine = rawParent ? `تحت ${escapeHtml(rawParent)}` : "فئة رئيسية";
  const parentLineText = rawParent ? `تحت ${rawParent}` : "فئة رئيسية";
  const subject = plainNotificationText(`اقتراح فئة جديدة: ${rawIcon} ${rawName}`);
  const html = `
    <p>مستخدم أضاف فئة جديدة في مصروفي.</p>
    <p><strong>${icon} ${name}</strong> — ${parentLine}</p>
    <p>راجعها من صفحة الإدارة: <a href="${escapeHtml(getSiteUrl())}/admin/settings">إعدادات البرنامج</a></p>
  `;
  const email = await sendAdminEmail(subject, html);

  try {
    const admin = createAdminClient();
    const { data: admins } = await admin.from("profiles").select("id").eq("is_admin", true);
    const adminIds = (admins ?? []).map((row) => row.id as string);

    if (adminIds.length > 0) {
      const { data: subscriptions } = await admin
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .in("user_id", adminIds);

      for (const subscription of subscriptions ?? []) {
        await sendWebPushNotification(subscription, {
          title: "اقتراح فئة جديدة",
          body: `${rawIcon} ${rawName} — ${parentLineText}`,
          url: "/admin/settings",
          tag: `category-suggestion:${suggestion.id}`,
        });
      }
    }
  } catch {
    // Admin client / push is optional.
  }

  return Response.json({ ok: true, emailed: email.sent });
}

async function handleDueNotifications(request: Request) {
  if (!isAuthorizedCron(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!getVapidConfig()) {
    return Response.json({ ok: true, skipped: "vapid_not_configured", sent: 0 });
  }

  let admin;

  try {
    admin = createAdminClient();
  } catch {
    return Response.json({ ok: true, skipped: "admin_not_configured", sent: 0 });
  }

  const { data: recurringRows, error: recurringError } = await admin
    .from("recurring_transactions")
    .select("*, categories(name, icon, color), wallets(name, icon, color)")
    .eq("is_active", true);

  if (recurringError) {
    return Response.json({ error: recurringError.message }, { status: 500 });
  }

  const dueRecurrings = getDueRecurringTransactions((recurringRows ?? []) as RecurringTransaction[]);

  if (dueRecurrings.length === 0) {
    return Response.json({ ok: true, sent: 0 });
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
    (profiles ?? []).map((row) => [String(row.id), isLocale(row.locale) ? row.locale : "ar"]),
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

  return Response.json({ ok: true, sent, due: dueRecurrings.length });
}

export async function handleApiRequest(request: Request) {
  const { pathname } = new URL(request.url);

  if (pathname === "/api/account/delete" && request.method === "DELETE") {
    return handleDeleteAccount(request);
  }

  if (pathname === "/api/admin/notify-category-suggestion" && request.method === "POST") {
    return handleNotifyCategorySuggestion(request);
  }

  if (pathname === "/api/cron/due-notifications" && request.method === "GET") {
    return handleDueNotifications(request);
  }

  return Response.json({ error: "not_found" }, { status: 404 });
}
