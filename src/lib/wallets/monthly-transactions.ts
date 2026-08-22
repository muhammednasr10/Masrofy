import { getMonthRange, isDateInMonthRange } from "@/lib/calendar";
import type { Transaction, Wallet } from "@/lib/types/database";
import { getWalletDescendantIds } from "@/lib/wallets/hierarchy";

export function getWalletScopeIds(
  walletId: string,
  wallets: Wallet[],
  includeDescendants: boolean,
) {
  if (!includeDescendants) {
    return [walletId];
  }

  return [walletId, ...getWalletDescendantIds(walletId, wallets)];
}

export function getWalletMonthlyTransactions(
  walletId: string,
  wallets: Wallet[],
  transactions: Transaction[],
  options: {
    includeDescendants?: boolean;
    monthStartDay?: number;
    limit?: number;
  } = {},
) {
  const { includeDescendants = false, monthStartDay = 1, limit } = options;
  const month = getMonthRange(new Date(), "ar", monthStartDay);
  const scopeIds = new Set(getWalletScopeIds(walletId, wallets, includeDescendants));

  const filtered = transactions.filter(
    (transaction) =>
      transaction.wallet_id &&
      scopeIds.has(transaction.wallet_id) &&
      isDateInMonthRange(transaction.transaction_date, month),
  );

  filtered.sort((left, right) => {
    const dateCompare = right.transaction_date.localeCompare(left.transaction_date);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return right.created_at.localeCompare(left.created_at);
  });

  return limit ? filtered.slice(0, limit) : filtered;
}
