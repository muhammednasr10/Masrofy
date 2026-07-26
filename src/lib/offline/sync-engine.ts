import { createClient } from "@/lib/supabase/client";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import {
  listPendingSyncItems,
  markSyncItemFailed,
  removeSyncItem,
  retryFailedSyncItems,
} from "@/lib/offline/sync-queue";
import { SYNC_COMPLETE_EVENT } from "@/lib/offline/events";

export type SyncResult = {
  syncedCount: number;
  failedCount: number;
};

export function isBrowserOnline() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

export async function flushOfflineSyncQueue(): Promise<SyncResult> {
  if (!isBrowserOnline()) {
    return { syncedCount: 0, failedCount: 0 };
  }

  const supabase = createClient();
  const user = await requireAuthenticatedUser(supabase);
  await retryFailedSyncItems(user.id);

  const pendingItems = await listPendingSyncItems(user.id);
  let syncedCount = 0;
  let failedCount = 0;

  for (const item of pendingItems) {
    if (item.type !== "insert_transaction") {
      continue;
    }

    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      wallet_id: item.payload.wallet_id,
      category_id: item.payload.category_id,
      amount: item.payload.amount,
      type: item.payload.type,
      note: item.payload.note,
      transaction_date: item.payload.transaction_date,
    });

    if (error) {
      await markSyncItemFailed(item.id, error.message);
      failedCount += 1;
      continue;
    }

    await removeSyncItem(item.id);
    syncedCount += 1;
  }

  if (syncedCount > 0 || failedCount > 0) {
    window.dispatchEvent(
      new CustomEvent(SYNC_COMPLETE_EVENT, {
        detail: { syncedCount, failedCount },
      }),
    );
  }

  return { syncedCount, failedCount };
}
