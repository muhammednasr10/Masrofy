"use client";

import { useOfflineSync } from "@/hooks/useOfflineSync";

export default function OfflineBanner() {
  const { online, pendingCount, syncing } = useOfflineSync();

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
        <p>أنت غير متصل — يمكنك إضافة مصروفات محلياً وسيتم رفعها عند عودة الإنترنت.</p>
      ) : syncing ? (
        <p>جاري رفع العمليات المحفوظة محلياً...</p>
      ) : pendingCount > 0 ? (
        <p>{pendingCount} عملية في انتظار المزامنة...</p>
      ) : null}
    </div>
  );
}
