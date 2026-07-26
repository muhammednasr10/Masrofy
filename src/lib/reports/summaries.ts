import type { Transaction, Wallet } from "@/lib/types/database";
import { parsePlanMonthKey } from "@/lib/plan/summary";
import { getMonthRange } from "@/lib/utils/format";
import { summarizeTransactions } from "@/lib/utils/summary";

export type WalletActivityRow = {
  walletId: string | null;
  name: string;
  icon: string;
  color: string;
  expenses: number;
  income: number;
  net: number;
  transactionCount: number;
};

export type MonthlyTrendRow = {
  planMonthKey: string;
  monthLabel: string;
  expenses: number;
  income: number;
  balance: number;
};

export function filterTransactionsForMonth(transactions: Transaction[], planMonthKey: string) {
  const month = getMonthRange(parsePlanMonthKey(planMonthKey));

  return transactions.filter(
    (transaction) =>
      transaction.transaction_date >= month.start && transaction.transaction_date <= month.end,
  );
}

export function summarizeTransactionsByWallet(
  transactions: Transaction[],
  wallets: Wallet[],
): WalletActivityRow[] {
  const walletMap = new Map(wallets.map((wallet) => [wallet.id, wallet]));
  const totals = new Map<
    string | null,
    Omit<WalletActivityRow, "walletId" | "net"> & { walletId: string | null }
  >();

  for (const transaction of transactions) {
    const walletId = transaction.wallet_id;
    const wallet = walletId ? walletMap.get(walletId) : null;
    const key = walletId ?? "none";
    const existing = totals.get(key);
    const amount = Number(transaction.amount);
    const isExpense = transaction.type === "expense";

    if (existing) {
      if (isExpense) {
        existing.expenses += amount;
      } else {
        existing.income += amount;
      }
      existing.transactionCount += 1;
      continue;
    }

    totals.set(key, {
      walletId,
      name: wallet?.name ?? transaction.wallets?.name ?? "بدون محفظة",
      icon: wallet?.icon ?? transaction.wallets?.icon ?? "💼",
      color: wallet?.color ?? transaction.wallets?.color ?? "#64748b",
      expenses: isExpense ? amount : 0,
      income: isExpense ? 0 : amount,
      transactionCount: 1,
    });
  }

  return Array.from(totals.values())
    .map((row) => ({
      ...row,
      net: row.income - row.expenses,
    }))
    .sort((a, b) => b.expenses + b.income - (a.expenses + a.income));
}

export function buildMonthlyTrend(
  transactions: Transaction[],
  planMonthKeys: string[],
): MonthlyTrendRow[] {
  return planMonthKeys.map((planMonthKey) => {
    const monthTransactions = filterTransactionsForMonth(transactions, planMonthKey);
    const summary = summarizeTransactions(monthTransactions);
    const month = getMonthRange(parsePlanMonthKey(planMonthKey));

    return {
      planMonthKey,
      monthLabel: month.label,
      expenses: summary.totalExpenses,
      income: summary.totalIncome,
      balance: summary.balance,
    };
  });
}

export function buildYearlyOverview(transactions: Transaction[], year: number) {
  const monthKeys = Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, "0");
    return `${year}-${month}`;
  });

  const rows = buildMonthlyTrend(transactions, monthKeys);
  const totals = rows.reduce(
    (acc, row) => ({
      expenses: acc.expenses + row.expenses,
      income: acc.income + row.income,
      balance: acc.balance + row.balance,
    }),
    { expenses: 0, income: 0, balance: 0 },
  );

  return { rows, totals, year };
}

export function getRecentMonthKeys(planMonthKey: string, count = 6) {
  const keys: string[] = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = parsePlanMonthKey(planMonthKey);
    date.setMonth(date.getMonth() - offset);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    keys.push(`${year}-${month}`);
  }

  return keys;
}
