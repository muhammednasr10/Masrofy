"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { DashboardAlert } from "@/lib/alerts/dashboard";

export function useHeaderAlerts() {
  const { locale } = useLocale();
  const pathname = usePathname();
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadAlerts() {
      try {
        const response = await fetch(`/api/alerts?locale=${locale}`, { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { alerts?: DashboardAlert[] };
        if (!cancelled) {
          setAlerts(payload.alerts ?? []);
        }
      } catch {
        // Ignore alert fetch failures in the header.
      }
    }

    void loadAlerts();

    return () => {
      cancelled = true;
    };
  }, [pathname, locale]);

  return alerts;
}
