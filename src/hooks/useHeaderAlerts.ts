"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { DashboardAlert } from "@/lib/alerts/dashboard";
import type { AlertsPanelData } from "@/lib/alerts/load-alerts";
import { createClient } from "@/lib/supabase/client";
import {
  registerRecurringDueTransaction,
  skipRecurringDueTransaction,
} from "@/lib/recurring/due-actions";
import type { RecurringTransaction } from "@/lib/types/database";

export function useHeaderAlerts() {
  const { locale } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [dueRecurrings, setDueRecurrings] = useState<RecurringTransaction[]>([]);
  const [currency, setCurrency] = useState("EGP");
  const [actingId, setActingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    try {
      const response = await fetch(`/api/alerts?locale=${locale}`, { cache: "no-store" });
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as AlertsPanelData;
      setAlerts(payload.alerts ?? []);
      setDueRecurrings(payload.dueRecurrings ?? []);
      setCurrency(payload.currency ?? "EGP");
    } catch {
      // Ignore alert fetch failures in the header.
    }
  }, [locale]);

  useEffect(() => {
    void loadAlerts();
  }, [pathname, loadAlerts]);

  const registerDue = useCallback(
    async (recurring: RecurringTransaction) => {
      setActingId(recurring.id);
      setActionError(null);

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setActionError("auth_required");
        setActingId(null);
        return;
      }

      const result = await registerRecurringDueTransaction(supabase, user.id, recurring);

      if (!result.ok) {
        setActionError(result.error);
        setActingId(null);
        return;
      }

      await loadAlerts();
      router.refresh();
      setActingId(null);
    },
    [loadAlerts, router],
  );

  const skipDue = useCallback(
    async (recurring: RecurringTransaction) => {
      setActingId(recurring.id);
      setActionError(null);

      const supabase = createClient();
      const result = await skipRecurringDueTransaction(supabase, recurring);

      if (!result.ok) {
        setActionError(result.error);
        setActingId(null);
        return;
      }

      await loadAlerts();
      router.refresh();
      setActingId(null);
    },
    [loadAlerts, router],
  );

  const totalCount = alerts.length + dueRecurrings.length;

  return {
    alerts,
    dueRecurrings,
    currency,
    actingId,
    actionError,
    totalCount,
    registerDue,
    skipDue,
    reload: loadAlerts,
  };
}
