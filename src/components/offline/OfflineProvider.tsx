"use client";

import OfflineBanner from "@/components/offline/OfflineBanner";

export default function OfflineProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OfflineBanner />
      {children}
    </>
  );
}
