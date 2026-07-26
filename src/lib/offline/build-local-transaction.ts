import type { Category, Transaction, TransactionType, Wallet } from "@/lib/types/database";
import type { InsertTransactionPayload, OfflineTransaction } from "@/lib/offline/types";

export function buildLocalTransaction(
  userId: string,
  clientTransactionId: string,
  payload: InsertTransactionPayload,
  categories: Category[],
  wallets: Wallet[],
): OfflineTransaction {
  const category = payload.category_id
    ? categories.find((item) => item.id === payload.category_id)
    : null;
  const wallet = wallets.find((item) => item.id === payload.wallet_id);

  return {
    id: clientTransactionId,
    user_id: userId,
    wallet_id: payload.wallet_id,
    category_id: payload.category_id,
    recurring_transaction_id: null,
    internal_transfer_id: null,
    transfer_role: null,
    amount: payload.amount,
    type: payload.type as TransactionType,
    note: payload.note,
    transaction_date: payload.transaction_date,
    created_at: new Date().toISOString(),
    categories: category
      ? { name: category.name, icon: category.icon, color: category.color }
      : payload.type === "income"
        ? null
        : null,
    wallets: wallet
      ? { name: wallet.name, icon: wallet.icon, color: wallet.color }
      : null,
    offlinePending: true,
  };
}
