import type { ExpensesCacheSnapshot } from "@/lib/offline/types";
import { getOfflineDb } from "@/lib/offline/db";

export async function saveExpensesCache(snapshot: ExpensesCacheSnapshot) {
  const db = getOfflineDb();
  await db.expensesCache.put(snapshot);
}

export async function loadExpensesCache(userId: string) {
  const db = getOfflineDb();
  return db.expensesCache.get(userId);
}

export async function clearExpensesCache(userId: string) {
  const db = getOfflineDb();
  await db.expensesCache.delete(userId);
}
