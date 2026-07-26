import type { Category, Transaction, Wallet } from "@/lib/types/database";
import type { OfflineTransaction } from "@/lib/offline/types";

export type ExpensesPageSnapshot = {
  currency: string;
  categories: Category[];
  wallets: Wallet[];
  transactions: OfflineTransaction[];
  monthTransactions: OfflineTransaction[];
  balanceTransactions: Pick<
    Transaction,
    "id" | "wallet_id" | "amount" | "type" | "transfer_role"
  >[];
};

export function appendTransactionToSnapshot(
  snapshot: ExpensesPageSnapshot,
  savedTransaction: OfflineTransaction,
  monthStart: string,
  monthEnd: string,
): ExpensesPageSnapshot {
  const nextTransactions = [savedTransaction, ...snapshot.transactions];
  const nextBalance = [
    {
      id: savedTransaction.id,
      wallet_id: savedTransaction.wallet_id,
      amount: savedTransaction.amount,
      type: savedTransaction.type,
      transfer_role: savedTransaction.transfer_role,
    },
    ...snapshot.balanceTransactions,
  ];
  const nextMonth =
    savedTransaction.transaction_date >= monthStart &&
    savedTransaction.transaction_date <= monthEnd
      ? [savedTransaction, ...snapshot.monthTransactions]
      : snapshot.monthTransactions;

  return {
    ...snapshot,
    transactions: nextTransactions,
    monthTransactions: nextMonth,
    balanceTransactions: nextBalance,
  };
}

export function removeTransactionFromSnapshot(
  snapshot: ExpensesPageSnapshot,
  transactionId: string,
): ExpensesPageSnapshot {
  return {
    ...snapshot,
    transactions: snapshot.transactions.filter((item) => item.id !== transactionId),
    monthTransactions: snapshot.monthTransactions.filter((item) => item.id !== transactionId),
    balanceTransactions: snapshot.balanceTransactions.filter(
      (item) => item.id !== transactionId,
    ),
  };
}
