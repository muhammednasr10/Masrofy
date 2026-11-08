import {
  collectDuePlanLines,
  formatDateKey,
  readPlanDueAnswers,
  writePlanDueAnswer,
  type DuePlanLine,
} from "@/lib/plan/expected-day";
import { horizonLinesFromItems } from "@/lib/plan/horizon-lines";
import { createClient } from "@/lib/supabase/client";
import type { Category, HorizonPlanItem } from "@/lib/types/database";

const NOTIFIED_KEY = "masrofy-plan-due-notified";

export async function loadDuePlanLines(): Promise<DuePlanLine[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: plan } = await supabase.from("horizon_plans").select("id").maybeSingle();

  if (!plan?.id) {
    return [];
  }

  const [{ data: items, error: itemsError }, { data: categories, error: categoriesError }] =
    await Promise.all([
      supabase.from("horizon_plan_items").select("*").eq("plan_id", plan.id),
      supabase.from("categories").select("*"),
    ]);

  if (itemsError || categoriesError || !items || !categories) {
    return [];
  }

  const today = new Date();
  const typedCategories = categories as Category[];
  const lines = horizonLinesFromItems(
    typedCategories,
    items as HorizonPlanItem[],
    formatDateKey(today),
  );
  let due = collectDuePlanLines(typedCategories, lines, today, readPlanDueAnswers());

  if (due.length === 0) {
    return [];
  }

  const { data: existing } = await supabase
    .from("transactions")
    .select("category_id, transaction_date, type")
    .in(
      "category_id",
      due.map((line) => line.categoryId),
    )
    .in(
      "transaction_date",
      [...new Set(due.map((line) => line.dueDate))],
    );

  const recorded = new Set(
    (existing ?? []).map(
      (row) => `${row.type}:${row.category_id}:${String(row.transaction_date).slice(0, 10)}`,
    ),
  );

  due = due.filter((line) => {
    if (!recorded.has(`${line.flow}:${line.categoryId}:${line.dueDate}`)) {
      return true;
    }

    writePlanDueAnswer(line.answerId, "yes");
    return false;
  });

  return due;
}

export async function notifyDuePlanLines(lines: DuePlanLine[], isArabic: boolean) {
  if (lines.length === 0 || !("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const today = formatDateKey(new Date());

  if (localStorage.getItem(NOTIFIED_KEY) === today) {
    return;
  }

  const title = "مصروفي";
  const body = isArabic
    ? lines.length === 1
      ? `ميعاد ${lines[0].name} جه. افتح التنبيهات وقول آه عشان يتحسب في الشهر.`
      : `ميعاد ${lines.length} بنود من الخطة جه. افتح التنبيهات وقول آه عشان تتحسب في الشهر.`
    : lines.length === 1
      ? `${lines[0].name} is due. Open alerts and confirm to count it this month.`
      : `${lines.length} plan items are due. Open alerts and confirm to count them this month.`;
  const options: NotificationOptions = {
    body,
    tag: `plan-due:${today}`,
    icon: "/icons/icon-192.png",
    data: { url: "/dashboard" },
  };
  const registration =
    "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;

  if (registration) {
    await registration.showNotification(title, options);
  } else {
    new Notification(title, options);
  }

  localStorage.setItem(NOTIFIED_KEY, today);
}
