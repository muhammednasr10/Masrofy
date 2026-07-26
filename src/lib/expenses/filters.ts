import type { Transaction, TransactionType } from "@/lib/types/database";

export type TransactionFilters = {
  search: string;
  dateFrom: string;
  dateTo: string;
  categoryId: string;
  walletId: string;
  type: TransactionType | "all";
};

export function emptyTransactionFilters(
  dateFrom = "",
  dateTo = "",
): TransactionFilters {
  return {
    search: "",
    dateFrom,
    dateTo,
    categoryId: "",
    walletId: "",
    type: "all",
  };
}

export function countActiveTransactionFilters(filters: TransactionFilters) {
  let count = 0;

  if (filters.search.trim()) count += 1;
  if (filters.categoryId) count += 1;
  if (filters.walletId) count += 1;
  if (filters.type !== "all") count += 1;

  return count;
}

export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters,
) {
  const search = filters.search.trim().toLowerCase();

  return transactions.filter((transaction) => {
    if (filters.dateFrom && transaction.transaction_date < filters.dateFrom) {
      return false;
    }

    if (filters.dateTo && transaction.transaction_date > filters.dateTo) {
      return false;
    }

    if (filters.categoryId && transaction.category_id !== filters.categoryId) {
      return false;
    }

    if (filters.walletId && transaction.wallet_id !== filters.walletId) {
      return false;
    }

    if (filters.type !== "all" && transaction.type !== filters.type) {
      return false;
    }

    if (!search) {
      return true;
    }

    const categoryName = transaction.categories?.name?.toLowerCase() ?? "";
    const walletName = transaction.wallets?.name?.toLowerCase() ?? "";
    const note = transaction.note?.toLowerCase() ?? "";
    const amount = String(transaction.amount);

    return (
      categoryName.includes(search) ||
      walletName.includes(search) ||
      note.includes(search) ||
      amount.includes(search)
    );
  });
}
