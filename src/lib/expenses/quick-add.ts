import { isDateInMonthRange } from "@/lib/calendar";
import { enqueueTransactionInsert, isBrowserOnline } from "@/lib/offline";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import type { Category, Wallet } from "@/lib/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export const QUICK_ADD_STORAGE_KEY = "masrofy_quick_add";
export const QUICK_ADD_EVENT = "masrofy:quick-add";

export function requestQuickAdd(categoryId?: string) {
  window.dispatchEvent(new CustomEvent(QUICK_ADD_EVENT, { detail: { categoryId } }));
}

export type QuickAddMemory = {
  categoryId: string;
  walletId: string;
};

export function quickExpenseDate(
  month: { start: string; end: string },
  today = new Date().toISOString().slice(0, 10),
) {
  return isDateInMonthRange(today, month) ? today : month.start;
}

export function readQuickAddMemory(
  storage: Pick<Storage, "getItem"> | null | undefined,
): QuickAddMemory | null {
  const raw = storage?.getItem(QUICK_ADD_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<QuickAddMemory>;

    if (!parsed.categoryId || !parsed.walletId) {
      return null;
    }

    return { categoryId: parsed.categoryId, walletId: parsed.walletId };
  } catch {
    return null;
  }
}

export function writeQuickAddMemory(
  storage: Pick<Storage, "setItem"> | null | undefined,
  memory: QuickAddMemory,
) {
  storage?.setItem(QUICK_ADD_STORAGE_KEY, JSON.stringify(memory));
}

export function pickQuickAddDefaults({
  categories,
  wallets,
  defaultWalletId,
  memory,
}: {
  categories: Category[];
  wallets: Wallet[];
  defaultWalletId?: string | null;
  memory: QuickAddMemory | null;
}) {
  const category =
    categories.find((item) => item.id === memory?.categoryId) ?? categories[0] ?? null;
  const wallet =
    wallets.find((item) => item.id === memory?.walletId) ??
    wallets.find((item) => item.id === defaultWalletId) ??
    wallets.find((item) => item.is_default) ??
    wallets[0] ??
    null;

  return {
    categoryId: category?.id ?? "",
    walletId: wallet?.id ?? "",
  };
}

export async function saveQuickExpense(
  supabase: SupabaseClient,
  input: {
    amount: number;
    categoryId: string;
    walletId: string;
    transactionDate: string;
  },
) {
  const user = await requireAuthenticatedUser(supabase);
  const payload = {
    wallet_id: input.walletId,
    category_id: input.categoryId || null,
    amount: input.amount,
    type: "expense" as const,
    note: null,
    transaction_date: input.transactionDate,
  };

  if (!isBrowserOnline()) {
    await enqueueTransactionInsert(user.id, crypto.randomUUID(), payload);
    return { offline: true };
  }

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    ...payload,
  });

  if (error) {
    throw error;
  }

  return { offline: false };
}
