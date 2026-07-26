import { loadSignedAttachmentUrls } from "@/lib/attachments";
import { loadExpensesCache, saveExpensesCache } from "@/lib/offline";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, Transaction, Wallet } from "@/lib/types/database";
import { normalizeWallets } from "@/lib/wallets";
import type { ExpensesPageSnapshot } from "@/lib/expenses/append-transaction";

export type LoadExpensesPageResult =
  | { kind: "success"; snapshot: ExpensesPageSnapshot; attachmentUrls: Record<string, string> }
  | { kind: "offline-missing"; message: string }
  | { kind: "offline-cache"; snapshot: ExpensesPageSnapshot }
  | { kind: "error"; message: string; fallbackSnapshot?: ExpensesPageSnapshot };

export async function loadExpensesPageData(
  supabase: SupabaseClient,
  userId: string,
  monthStart: string,
  monthEnd: string,
  options?: { useNetwork?: boolean },
): Promise<LoadExpensesPageResult> {
  const useNetwork = options?.useNetwork ?? true;

  if (!useNetwork) {
    const cached = await loadExpensesCache(userId);

    if (!cached) {
      return {
        kind: "offline-missing",
        message: "لا توجد بيانات محفوظة محلياً. اتصل بالإنترنت مرة واحدة على الأقل.",
      };
    }

    return { kind: "offline-cache", snapshot: cached };
  }

  try {
    const [
      { data: profile },
      { data: categoryRows },
      { data: walletRows },
      { data: transactionRows },
      { data: monthRows },
      { data: balanceRows },
    ] = await Promise.all([
      supabase.from("profiles").select("currency, default_wallet_id").maybeSingle(),
      supabase.from("categories").select("*").order("sort_order", { ascending: true }),
      supabase.from("wallets").select("*").order("sort_order", { ascending: true }),
      supabase
        .from("transactions")
        .select("*, categories(name, icon, color), wallets(name, icon, color)")
        .order("transaction_date", { ascending: false }),
      supabase
        .from("transactions")
        .select("*, categories(name, icon, color)")
        .gte("transaction_date", monthStart)
        .lte("transaction_date", monthEnd)
        .order("transaction_date", { ascending: false }),
      supabase.from("transactions").select("id, wallet_id, amount, type, transfer_role"),
    ]);

    const expenseTransactions = ((transactionRows ?? []) as Transaction[]).filter(
      (transaction) => transaction.type !== "transfer",
    );
    const attachmentUrls = await loadSignedAttachmentUrls(
      supabase,
      expenseTransactions.map((transaction) => transaction.id),
    );
    const typedWallets = normalizeWallets((walletRows ?? []) as Wallet[]);
    const monthTransactions = ((monthRows ?? []) as Transaction[]).filter(
      (transaction) => transaction.type !== "transfer",
    );
    const balanceTransactions = (balanceRows ?? []) as Pick<
      Transaction,
      "id" | "wallet_id" | "amount" | "type" | "transfer_role"
    >[];

    const snapshot: ExpensesPageSnapshot = {
      currency: profile?.currency ?? "EGP",
      categories: (categoryRows ?? []) as Category[],
      wallets: typedWallets,
      transactions: expenseTransactions,
      monthTransactions,
      balanceTransactions,
    };

    await saveExpensesCache({
      userId,
      cachedAt: new Date().toISOString(),
      currency: snapshot.currency,
      categories: snapshot.categories,
      wallets: snapshot.wallets,
      transactions: snapshot.transactions,
      monthTransactions: snapshot.monthTransactions,
      balanceTransactions: snapshot.balanceTransactions,
      monthStart,
      monthEnd,
    });

    return { kind: "success", snapshot, attachmentUrls };
  } catch (loadFailure) {
    const cached = await loadExpensesCache(userId);

    if (cached) {
      return {
        kind: "error",
        message: "تعذر الاتصال — تم عرض آخر نسخة محفوظة محلياً.",
        fallbackSnapshot: cached,
      };
    }

    return {
      kind: "error",
      message: loadFailure instanceof Error ? loadFailure.message : "تعذر تحميل المصروفات.",
    };
  }
}
