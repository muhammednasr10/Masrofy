"use client";

import { useEffect } from "react";
import { SYNC_COMPLETE_EVENT } from "@/lib/offline/events";

export function useSyncCompleteListener(onComplete: () => void) {
  useEffect(() => {
    function handleSyncComplete() {
      onComplete();
    }

    window.addEventListener(SYNC_COMPLETE_EVENT, handleSyncComplete);
    return () => {
      window.removeEventListener(SYNC_COMPLETE_EVENT, handleSyncComplete);
    };
  }, [onComplete]);
}
