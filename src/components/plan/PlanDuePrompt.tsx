"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  collectDuePlanLines,
  formatDateKey,
  readPlanDueAnswers,
  writePlanDueAnswer,
  type DuePlanLine,
} from "@/lib/plan/expected-day";
import { horizonLinesFromItems } from "@/lib/plan/horizon-lines";
import { recordPlanDueTransaction } from "@/lib/plan/record-plan-due";
import { createClient } from "@/lib/supabase/client";
import type { Category, HorizonPlanItem } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils/format";

const NOTIFIED_KEY = "masrofy-plan-due-notified";

async function loadDuePlanLines() {
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
    (existing ?? []).map((row) => `${row.type}:${row.category_id}:${String(row.transaction_date).slice(0, 10)}`),
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

async function notifyDueLines(lines: DuePlanLine[], isArabic: boolean) {
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
      ? `ميعاد ${lines[0].name} جه. افتح التطبيق وقول آه عشان يتحسب في الشهر.`
      : `ميعاد ${lines.length} بنود من الخطة جه. افتح التطبيق وقول آه عشان تتحسب في الشهر.`
    : lines.length === 1
      ? `${lines[0].name} is due. Open the app and confirm to count it this month.`
      : `${lines.length} plan items are due. Open the app and confirm to count them this month.`;
  const options: NotificationOptions = {
    body,
    tag: `plan-due:${today}`,
    icon: "/icons/icon-192.png",
    data: { url: "/plan" },
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

export default function PlanDuePrompt() {
  const { locale } = useLocale();
  const [lines, setLines] = useState<DuePlanLine[]>([]);
  const [currency, setCurrency] = useState("EGP");
  const [walletNames, setWalletNames] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isArabic = locale !== "en";

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const [{ data: profile }, { data: walletRows }, due] = await Promise.all([
      supabase.from("profiles").select("currency").maybeSingle(),
      supabase.from("wallets").select("id, name"),
      loadDuePlanLines(),
    ]);

    if (profile?.currency) {
      setCurrency(profile.currency);
    }

    setWalletNames(
      Object.fromEntries((walletRows ?? []).map((wallet) => [wallet.id, wallet.name])),
    );

    setLines(due);
    await notifyDueLines(due, isArabic);
  }, [isArabic]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    const onFocus = () => {
      void refresh();
    };

    window.addEventListener("focus", onFocus);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  async function answer(line: DuePlanLine, value: "yes" | "no") {
    setBusyId(line.answerId);
    setError(null);

    try {
      if (value === "yes") {
        await recordPlanDueTransaction(createClient(), line);
      }

      writePlanDueAnswer(line.answerId, value);
      setLines((current) => current.filter((item) => item.answerId !== line.answerId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر تسجيل المبلغ.");
    } finally {
      setBusyId(null);
    }
  }

  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-due-title"
        className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl"
      >
        <h2 id="plan-due-title" className="text-base font-semibold text-slate-900">
          {isArabic ? "ميعاد من الخطة" : "Plan due date"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {isArabic
            ? "لو قلت آه يتحسب في الشهر، ويتخصم من المحفظة أو يتزاد عليها."
            : "Yes counts it this month and updates the wallet."}
        </p>
        <ul className="mt-4 space-y-3">
          {lines.map((line) => {
            const kind = line.flow === "income" ? (isArabic ? "دخل" : "income") : isArabic ? "مصروف" : "expense";
            const walletName = (line.walletId && walletNames[line.walletId]) || (isArabic ? "المحفظة الافتراضية" : "the default wallet");
            const walletEffect = line.flow === "income"
              ? isArabic
                ? `يتزاد على ${walletName}`
                : `Added to ${walletName}`
              : isArabic
                ? `يتخصم من ${walletName}`
                : `Deducted from ${walletName}`;

            return (
              <li key={line.answerId} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-900">
                  {line.name}
                  <span className="ms-2 text-xs font-normal text-slate-500">{kind}</span>
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {formatCurrency(line.amount, currency, locale)}
                  <span className="mt-1 block text-xs text-slate-500">{walletEffect}</span>
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={busyId != null}
                    onClick={() => void answer(line, "yes")}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {isArabic ? "آه" : "Yes"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId != null}
                    onClick={() => void answer(line, "no")}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-60"
                  >
                    {isArabic ? "لأ" : "No"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </div>
    </div>
  );
}
