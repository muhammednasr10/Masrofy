import type { MonthlySummary, Transaction } from "@/lib/types/database";

export function getCategoryExpenseTransactions(
  transactions: Transaction[],
  category: Pick<MonthlySummary["byCategory"][number], "categoryId">,
) {
  return transactions
    .filter((transaction) => transaction.type === "expense")
    .filter((transaction) =>
      category.categoryId === null
        ? transaction.category_id === null
        : transaction.category_id === category.categoryId,
    )
    .sort((left, right) => {
      const dateCompare = right.transaction_date.localeCompare(left.transaction_date);

      if (dateCompare !== 0) {
        return dateCompare;
      }

      return right.created_at.localeCompare(left.created_at);
    });
}
