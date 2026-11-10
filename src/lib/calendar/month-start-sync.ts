import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeMonthStartDay } from "@/lib/calendar/month-cycle";

export type MonthStartMode = "fixed" | "category";

export function normalizeMonthStartMode(value: unknown): MonthStartMode {
  return value === "category" ? "category" : "fixed";
}

export function dayFromTransactionDate(transactionDate: string) {
  const day = Number(transactionDate.slice(0, 10).slice(8, 10));
  return normalizeMonthStartDay(day);
}

/** When month start is linked to a category, follow that category's latest recording day. */
export async function syncMonthStartFromCategoryTransaction(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string | null | undefined,
  transactionDate: string,
) {
  if (!categoryId) {
    return;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("month_start_mode, month_start_category_id")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) {
    return;
  }

  if (
    normalizeMonthStartMode(profile.month_start_mode) !== "category" ||
    profile.month_start_category_id !== categoryId
  ) {
    return;
  }

  const nextDay = dayFromTransactionDate(transactionDate);

  await supabase
    .from("profiles")
    .update({ month_start_day: nextDay })
    .eq("id", userId);
}

export async function resolveCategoryMonthStartDay(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
) {
  const { data } = await supabase
    .from("transactions")
    .select("transaction_date")
    .eq("user_id", userId)
    .eq("category_id", categoryId)
    .order("transaction_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.transaction_date) {
    return null;
  }

  return dayFromTransactionDate(data.transaction_date);
}
