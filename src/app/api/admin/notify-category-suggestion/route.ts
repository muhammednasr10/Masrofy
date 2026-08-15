import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAdminEmail } from "@/lib/admin/email";
import { sendWebPushNotification } from "@/lib/notifications/web-push";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { categoryId?: string } | null;
  const categoryId = body?.categoryId;

  if (!categoryId) {
    return NextResponse.json({ error: "missing_category" }, { status: 400 });
  }

  const { data: suggestion } = await supabase
    .from("category_suggestions")
    .select("id, name, icon, parent_name, status")
    .eq("category_id", categoryId)
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (!suggestion) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const parentLine = suggestion.parent_name ? `تحت ${suggestion.parent_name}` : "فئة رئيسية";
  const subject = `اقتراح فئة جديدة: ${suggestion.icon} ${suggestion.name}`;
  const html = `
    <p>مستخدم أضاف فئة جديدة في مصروفي.</p>
    <p><strong>${suggestion.icon} ${suggestion.name}</strong> — ${parentLine}</p>
    <p>راجعها من صفحة الإدارة: <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://masrofy-sigma.vercel.app"}/admin/categories">مراجعة الفئات</a></p>
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
          body: `${suggestion.icon} ${suggestion.name} — ${parentLine}`,
          url: "/admin/categories",
          tag: `category-suggestion:${suggestion.id}`,
        });
      }
    }
  } catch {
    // Admin client / push is optional.
  }

  return NextResponse.json({ ok: true, emailed: email.sent });
}
