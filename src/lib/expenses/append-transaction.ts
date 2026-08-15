import type { Category, Transaction, Wallet } from "@/lib/types/database";
import type { OfflineTransaction } from "@/lib/offline/types";
import { isDateInMonthRange } from "@/lib/calendar";

export type ExpensesPageSnapshot = {
  currency: string;
  monthStartDay?: number;
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
  const nextMonth = isDateInMonthRange(savedTransaction.transaction_date, {
    start: monthStart,
    end: monthEnd,
  })
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

export function updateTransactionInSnapshot(
  snapshot: ExpensesPageSnapshot,
  updatedTransaction: OfflineTransaction,
  monthStart: string,
  monthEnd: string,
): ExpensesPageSnapshot {
  const nextTransactions = snapshot.transactions.map((item) =>
    item.id === updatedTransaction.id ? updatedTransaction : item,
  );
  const nextBalanceTransactions = snapshot.balanceTransactions.map((item) =>
    item.id === updatedTransaction.id
      ? {
          id: updatedTransaction.id,
          wallet_id: updatedTransaction.wallet_id,
          amount: updatedTransaction.amount,
          type: updatedTransaction.type,
          transfer_role: updatedTransaction.transfer_role,
        }
      : item,
  );
  const nextMonthTransactions = nextTransactions.filter((item) =>
    isDateInMonthRange(item.transaction_date, { start: monthStart, end: monthEnd }),
  );

  return {
    ...snapshot,
    transactions: nextTransactions,
    monthTransactions: nextMonthTransactions,
    balanceTransactions: nextBalanceTransactions,
  };
}
