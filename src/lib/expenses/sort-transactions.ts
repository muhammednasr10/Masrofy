import type { Transaction } from "@/lib/types/database";

/** Newest first: transaction_date, then created_at (time), then id. */
export function compareTransactionsNewestFirst(
  left: Pick<Transaction, "id" | "transaction_date" | "created_at">,
  right: Pick<Transaction, "id" | "transaction_date" | "created_at">,
) {
  const dateCompare = right.transaction_date.localeCompare(left.transaction_date);

  if (dateCompare !== 0) {
    return dateCompare;
  }

  const createdLeft = left.created_at ?? "";
  const createdRight = right.created_at ?? "";
  const createdCompare = createdRight.localeCompare(createdLeft);

  if (createdCompare !== 0) {
    return createdCompare;
  }

  return right.id.localeCompare(left.id);
}

export function sortTransactionsNewestFirst<T extends Pick<Transaction, "id" | "transaction_date" | "created_at">>(
  transactions: T[],
) {
  return [...transactions].sort(compareTransactionsNewestFirst);
}
