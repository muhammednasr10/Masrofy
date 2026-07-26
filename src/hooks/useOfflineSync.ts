"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { countPendingSyncItems, flushOfflineSyncQueue } from "@/lib/offline";
import { SYNC_COMPLETE_EVENT } from "@/lib/offline/events";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export function useOfflineSync() {
  const online = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setPendingCount(0);
      return;
    }

    setPendingCount(await countPendingSyncItems(user.id));
  }, []);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    if (!online) {
      return;
    }

    let cancelled = false;

    async function runSync() {
      setSyncing(true);

      try {
        await flushOfflineSyncQueue();
        if (!cancelled) {
          await refreshPendingCount();
        }
      } finally {
        if (!cancelled) {
          setSyncing(false);
        }
      }
    }

    void runSync();

    return () => {
      cancelled = true;
    };
  }, [online, refreshPendingCount]);

  useEffect(() => {
    function handleSyncComplete() {
      refreshPendingCount();
    }

    window.addEventListener(SYNC_COMPLETE_EVENT, handleSyncComplete);
    return () => {
      window.removeEventListener(SYNC_COMPLETE_EVENT, handleSyncComplete);
    };
  }, [refreshPendingCount]);

  return {
    online,
    pendingCount,
    syncing,
  };
}
