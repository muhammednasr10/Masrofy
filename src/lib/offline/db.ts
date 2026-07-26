import Dexie, { type Table } from "dexie";
import type { ExpensesCacheSnapshot, SyncQueueItem } from "@/lib/offline/types";

class MasrofyOfflineDb extends Dexie {
  expensesCache!: Table<ExpensesCacheSnapshot, string>;
  syncQueue!: Table<SyncQueueItem, string>;

  constructor() {
    super("masrofy-offline");

    this.version(1).stores({
      expensesCache: "userId",
      syncQueue: "id, userId, status, clientTransactionId, createdAt",
    });
  }
}

let dbInstance: MasrofyOfflineDb | null = null;

export function getOfflineDb() {
  if (typeof window === "undefined") {
    throw new Error("Offline database is only available in the browser.");
  }

  if (!dbInstance) {
    dbInstance = new MasrofyOfflineDb();
  }

  return dbInstance;
}
