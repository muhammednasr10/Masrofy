import { sortTransactionsNewestFirst } from "@/lib/expenses/sort-transactions";
import type { MonthlySummary, Transaction } from "@/lib/types/database";

export function getCategoryExpenseTransactions(
  transactions: Transaction[],
  category: Pick<MonthlySummary["byCategory"][number], "categoryId">,
) {
  return sortTransactionsNewestFirst(
    transactions
      .filter((transaction) => transaction.type === "expense")
      .filter((transaction) =>
        category.categoryId === null
          ? transaction.category_id === null
          : transaction.category_id === category.categoryId,
      ),
  );
}
