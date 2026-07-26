import type { MonthlySummary, Transaction } from "@/lib/types/database";

export function summarizeTransactions(
  transactions: Transaction[],
): MonthlySummary {
  let totalExpenses = 0;
  let totalIncome = 0;
  const categoryTotals = new Map<
    string,
    MonthlySummary["byCategory"][number]
  >();

  for (const transaction of transactions) {
    const amount = Number(transaction.amount);

    if (transaction.type === "transfer") {
      continue;
    }

    if (transaction.type === "expense") {
      totalExpenses += amount;
    } else {
      totalIncome += amount;
    }

    if (transaction.type !== "expense") {
      continue;
    }

    const key = transaction.category_id ?? "uncategorized";
    const existing = categoryTotals.get(key);

    if (existing) {
      existing.total += amount;
      continue;
    }

    categoryTotals.set(key, {
      categoryId: transaction.category_id,
      name: transaction.categories?.name ?? "بدون فئة",
      icon: transaction.categories?.icon ?? "📦",
      color: transaction.categories?.color ?? "#64748b",
      total: amount,
    });
  }

  return {
    totalExpenses,
    totalIncome,
    balance: totalIncome - totalExpenses,
    byCategory: Array.from(categoryTotals.values()).sort(
      (a, b) => b.total - a.total,
    ),
  };
}
