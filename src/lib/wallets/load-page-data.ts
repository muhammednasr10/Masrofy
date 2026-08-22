import type { Locale } from "@/i18n/config";
import { getMonthRange, normalizeMonthStartDay } from "@/lib/calendar";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  InternalWalletTransfer,
  Investment,
  Transaction,
  Wallet,
  WalletReconciliation,
} from "@/lib/types/database";
import { normalizeWallets, sortWallets } from "@/lib/wallets/normalize";

export type WalletsPageData = {
  currency: string;
  monthStartDay: number;
  wallets: Wallet[];
  investments: Investment[];
  transactions: Transaction[];
  monthTransactions: Transaction[];
  reconciliations: WalletReconciliation[];
  internalTransfers: InternalWalletTransfer[];
  walletLoadError?: string;
};

export async function loadWalletsPageData(
  supabase: SupabaseClient,
  locale: Locale = "ar",
): Promise<WalletsPageData> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("currency, month_start_day")
    .maybeSingle();
  const resolvedMonthStartDay = normalizeMonthStartDay(profile?.month_start_day);
  const month = getMonthRange(new Date(), locale, resolvedMonthStartDay);

  const [
    walletResult,
    { data: transactionRows },
    { data: monthTransactionRows },
    { data: investmentRows },
    reconciliationResult,
    internalTransferResult,
  ] = await Promise.all([
    supabase.from("wallets").select("*").order("sort_order", { ascending: true }),
    supabase.from("transactions").select("id, wallet_id, amount, type, transfer_role"),
    supabase
      .from("transactions")
      .select("*, categories(name, icon, color), wallets(name, icon, color)")
      .gte("transaction_date", month.start)
      .lte("transaction_date", month.end)
      .order("transaction_date", { ascending: false }),
    supabase.from("investments").select("*").order("sort_order", { ascending: true }),
    supabase
      .from("wallet_reconciliations")
      .select("*, wallets(name, icon, color)")
      .order("reconciled_at", { ascending: false })
      .limit(30),
    supabase
      .from("internal_wallet_transfers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return {
    currency: profile?.currency ?? "EGP",
    monthStartDay: resolvedMonthStartDay,
    wallets: sortWallets(normalizeWallets((walletResult.data ?? []) as Wallet[])),
    investments: (investmentRows ?? []) as Investment[],
    transactions: (transactionRows ?? []) as Transaction[],
    monthTransactions: (monthTransactionRows ?? []) as Transaction[],
    reconciliations: reconciliationResult.error
      ? []
      : ((reconciliationResult.data ?? []) as WalletReconciliation[]),
    internalTransfers: internalTransferResult.error
      ? []
      : ((internalTransferResult.data ?? []) as InternalWalletTransfer[]),
    walletLoadError: walletResult.error?.message,
  };
}
