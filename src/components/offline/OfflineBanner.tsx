"use client";

import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useTranslations } from "@/components/i18n/LocaleProvider";

export default function OfflineBanner() {
  const { online, pendingCount, syncing } = useOfflineSync();
  const t = useTranslations();

  if (online && pendingCount === 0 && !syncing) {
    return null;
  }

  return (
    <div
      className={`border-b px-4 py-2 text-center text-sm ${
        online
          ? "border-emerald-100 bg-emerald-50 text-emerald-800"
          : "border-amber-100 bg-amber-50 text-amber-900"
      }`}
    >
      {!online ? (
        <p>{t("offline.offlineMessage")}</p>
      ) : syncing ? (
        <p>{t("offline.syncing")}</p>
      ) : pendingCount > 0 ? (
        <p>{t("offline.pending", { count: pendingCount })}</p>
      ) : null}
    </div>
  );
}
