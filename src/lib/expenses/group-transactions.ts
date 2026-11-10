import { compareTransactionsNewestFirst } from "@/lib/expenses/sort-transactions";
import { roundMoney } from "@/lib/utils/money";
import type { OfflineTransaction } from "@/lib/offline/types";

export type GroupedTransactionRow = OfflineTransaction & {
  /** All transaction ids represented by this row (newest first). */
  groupIds: string[];
  groupCount: number;
};

function groupKey(transaction: OfflineTransaction) {
  return [
    transaction.transaction_date.slice(0, 10),
    transaction.category_id ?? "",
    transaction.type,
    transaction.wallet_id,
  ].join("|");
}

/**
 * Collapse rows that share the same date, category, type, and wallet into one
 * display row with a summed amount. Newest transaction is the representative.
 */
export function groupIdenticalTransactions(
  transactions: OfflineTransaction[],
): GroupedTransactionRow[] {
  const groups = new Map<string, OfflineTransaction[]>();

  for (const transaction of transactions) {
    const key = groupKey(transaction);
    const bucket = groups.get(key);

    if (bucket) {
      bucket.push(transaction);
    } else {
      groups.set(key, [transaction]);
    }
  }

  const rows: GroupedTransactionRow[] = [];

  for (const bucket of groups.values()) {
    const ordered = [...bucket].sort(compareTransactionsNewestFirst);
    const primary = ordered[0];
    const amount = roundMoney(
      ordered.reduce((sum, transaction) => sum + Number(transaction.amount), 0),
    );
    const notes = ordered
      .map((transaction) => transaction.note?.trim() ?? "")
      .filter(Boolean);
    const uniqueNotes = [...new Set(notes)];

    rows.push({
      ...primary,
      amount,
      note: uniqueNotes.length > 0 ? uniqueNotes.join(" · ") : primary.note,
      groupIds: ordered.map((transaction) => transaction.id),
      groupCount: ordered.length,
      offlinePending: ordered.some((transaction) => transaction.offlinePending),
    });
  }

  return rows.sort(compareTransactionsNewestFirst);
}
