import { formatLocalDate, parseLocalDate } from "@/lib/calendar/dates";
import { roundMoney } from "@/lib/utils/money";
import type { Transaction } from "@/lib/types/database";

export type DailyMonthSummaryRow = {
  date: string;
  income: number;
  expense: number;
  net: number;
};

export type DailyMonthSummary = {
  days: DailyMonthSummaryRow[];
  totalIncome: number;
  totalExpense: number;
  totalNet: number;
};

function eachDateKey(start: string, end: string) {
  const keys: string[] = [];
  const cursor = parseLocalDate(start);
  const last = parseLocalDate(end);

  while (cursor <= last) {
    keys.push(formatLocalDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return keys;
}

/** One row per day in [start, end], plus month totals. Oldest day first. */
export function buildDailyMonthSummary(
  transactions: Array<Pick<Transaction, "amount" | "type" | "transaction_date">>,
  monthStart: string,
  monthEnd: string,
): DailyMonthSummary {
  const byDay = new Map<string, { income: number; expense: number }>();

  for (const key of eachDateKey(monthStart, monthEnd)) {
    byDay.set(key, { income: 0, expense: 0 });
  }

  for (const transaction of transactions) {
    if (transaction.type === "transfer") {
      continue;
    }

    const date = transaction.transaction_date.slice(0, 10);

    if (date < monthStart || date > monthEnd) {
      continue;
    }

    const bucket = byDay.get(date) ?? { income: 0, expense: 0 };
    const amount = Number(transaction.amount) || 0;

    if (transaction.type === "income") {
      bucket.income = roundMoney(bucket.income + amount);
    } else if (transaction.type === "expense") {
      bucket.expense = roundMoney(bucket.expense + amount);
    }

    byDay.set(date, bucket);
  }

  const days = [...byDay.entries()]
    .map(([date, totals]) => ({
      date,
      income: totals.income,
      expense: totals.expense,
      net: roundMoney(totals.income - totals.expense),
    }))
    .sort((left, right) => left.date.localeCompare(right.date));

  const totalIncome = roundMoney(days.reduce((sum, day) => sum + day.income, 0));
  const totalExpense = roundMoney(days.reduce((sum, day) => sum + day.expense, 0));

  return {
    days,
    totalIncome,
    totalExpense,
    totalNet: roundMoney(totalIncome - totalExpense),
  };
}
