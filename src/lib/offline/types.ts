import type { Category, Transaction, Wallet } from "@/lib/types/database";

export type OfflineTransaction = Transaction & {
  offlinePending?: boolean;
};

export type ExpensesCacheSnapshot = {
  userId: string;
  cachedAt: string;
  currency: string;
  categories: Category[];
  wallets: Wallet[];
  transactions: OfflineTransaction[];
  monthTransactions: OfflineTransaction[];
  balanceTransactions: Pick<
    Transaction,
    "id" | "wallet_id" | "amount" | "type" | "transfer_role"
  >[];
  monthStart: string;
  monthEnd: string;
};

export type InsertTransactionPayload = {
  wallet_id: string;
  category_id: string | null;
  amount: number;
  type: Transaction["type"];
  note: string | null;
  transaction_date: string;
};

export type SyncQueueItem = {
  id: string;
  userId: string;
  type: "insert_transaction";
  clientTransactionId: string;
  payload: InsertTransactionPayload;
  status: "pending" | "failed";
  errorMessage: string | null;
  createdAt: string;
};
