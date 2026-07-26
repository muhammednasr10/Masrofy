import type { InsertTransactionPayload, SyncQueueItem } from "@/lib/offline/types";
import { getOfflineDb } from "@/lib/offline/db";

export async function enqueueTransactionInsert(
  userId: string,
  clientTransactionId: string,
  payload: InsertTransactionPayload,
) {
  const db = getOfflineDb();
  const item: SyncQueueItem = {
    id: crypto.randomUUID(),
    userId,
    type: "insert_transaction",
    clientTransactionId,
    payload,
    status: "pending",
    errorMessage: null,
    createdAt: new Date().toISOString(),
  };

  await db.syncQueue.put(item);
  return item;
}

async function listSyncItemsByStatus(userId: string, status: SyncQueueItem["status"]) {
  const db = getOfflineDb();
  return db.syncQueue
    .where("userId")
    .equals(userId)
    .filter((item) => item.status === status)
    .sortBy("createdAt");
}

export async function listPendingSyncItems(userId: string) {
  return listSyncItemsByStatus(userId, "pending");
}

export async function listFailedSyncItems(userId: string) {
  return listSyncItemsByStatus(userId, "failed");
}

export async function countPendingSyncItems(userId: string) {
  const items = await listPendingSyncItems(userId);
  return items.length;
}

export async function removeSyncItem(id: string) {
  const db = getOfflineDb();
  await db.syncQueue.delete(id);
}

export async function markSyncItemFailed(id: string, errorMessage: string) {
  const db = getOfflineDb();
  await db.syncQueue.update(id, {
    status: "failed",
    errorMessage,
  });
}

export async function retryFailedSyncItems(userId: string) {
  const db = getOfflineDb();
  const failedItems = await listFailedSyncItems(userId);

  await Promise.all(
    failedItems.map((item) =>
      db.syncQueue.update(item.id, {
        status: "pending",
        errorMessage: null,
      }),
    ),
  );
}
