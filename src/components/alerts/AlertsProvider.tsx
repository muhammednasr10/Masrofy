"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useSelectedMonth } from "@/components/month/SelectedMonthProvider";
import { useSyncCompleteListener } from "@/hooks/useSyncCompleteListener";
import { useDueRecurringNotifications } from "@/hooks/useDueRecurringNotifications";
import { loadHeaderAlerts } from "@/lib/alerts/load-alerts";
import type { DashboardAlert } from "@/lib/alerts/dashboard";
import type { DuePlanLine } from "@/lib/plan/expected-day";
import { writePlanDueAnswer } from "@/lib/plan/expected-day";
import { loadDuePlanLines, notifyDuePlanLines } from "@/lib/plan/load-due-plan-lines";
import { recordPlanDueTransaction } from "@/lib/plan/record-plan-due";
import {
  registerRecurringDueTransaction,
  skipRecurringDueTransaction,
} from "@/lib/recurring/due-actions";
import { createClient } from "@/lib/supabase/client";
import type { RecurringTransaction } from "@/lib/types/database";
import { usePathname, useRouter } from "@/lib/router/navigation";

export type AlertsPanelSource = "header" | "fab";

type AlertsContextValue = {
  alerts: DashboardAlert[];
  dueRecurrings: RecurringTransaction[];
  duePlanLines: DuePlanLine[];
  currency: string;
  walletNames: Record<string, string>;
  actingId: string | null;
  actionError: string | null;
  totalCount: number;
  panelSource: AlertsPanelSource | null;
  openPanel: (source: AlertsPanelSource) => void;
  closePanel: () => void;
  togglePanel: (source: AlertsPanelSource) => void;
  registerDue: (recurring: RecurringTransaction) => Promise<void>;
  skipDue: (recurring: RecurringTransaction) => Promise<void>;
  confirmPlanDue: (line: DuePlanLine) => Promise<void>;
  dismissPlanDue: (line: DuePlanLine) => Promise<void>;
  reload: () => Promise<void>;
};

const AlertsContext = createContext<AlertsContextValue | null>(null);

export function AlertsProvider({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const { referenceDate } = useSelectedMonth();
  const pathname = usePathname();
  const router = useRouter();
  const isArabic = locale !== "en";

  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [dueRecurrings, setDueRecurrings] = useState<RecurringTransaction[]>([]);
  const [duePlanLines, setDuePlanLines] = useState<DuePlanLine[]>([]);
  const [currency, setCurrency] = useState("EGP");
  const [walletNames, setWalletNames] = useState<Record<string, string>>({});
  const [actingId, setActingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [panelSource, setPanelSource] = useState<AlertsPanelSource | null>(null);

  const loadAlerts = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const [payload, duePlans, { data: walletRows }] = await Promise.all([
        loadHeaderAlerts(supabase, user?.id, locale, referenceDate),
        loadDuePlanLines(),
        supabase.from("wallets").select("id, name"),
      ]);

      setAlerts(payload.alerts ?? []);
      setDueRecurrings(payload.dueRecurrings ?? []);
      setDuePlanLines(duePlans);
      setCurrency(payload.currency ?? "EGP");
      setWalletNames(
        Object.fromEntries((walletRows ?? []).map((wallet) => [wallet.id, wallet.name])),
      );
      await notifyDuePlanLines(duePlans, isArabic);
    } catch {
      // Ignore alert fetch failures in the shell.
    }
  }, [isArabic, locale, referenceDate]);

  useEffect(() => {
    void loadAlerts();
  }, [pathname, loadAlerts]);

  useSyncCompleteListener(loadAlerts);
  useDueRecurringNotifications(dueRecurrings, locale);

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

  const confirmPlanDue = useCallback(
    async (line: DuePlanLine) => {
      setActingId(line.answerId);
      setActionError(null);

      try {
        await recordPlanDueTransaction(createClient(), line);
        writePlanDueAnswer(line.answerId, "yes");
        setDuePlanLines((current) => current.filter((item) => item.answerId !== line.answerId));
        router.refresh();
      } catch (caught) {
        setActionError(caught instanceof Error ? caught.message : "تعذر تسجيل المبلغ.");
      } finally {
        setActingId(null);
      }
    },
    [router],
  );

  const dismissPlanDue = useCallback(async (line: DuePlanLine) => {
    setActingId(line.answerId);
    setActionError(null);
    writePlanDueAnswer(line.answerId, "no");
    setDuePlanLines((current) => current.filter((item) => item.answerId !== line.answerId));
    setActingId(null);
  }, []);

  const totalCount = alerts.length + dueRecurrings.length + duePlanLines.length;

  const value = useMemo<AlertsContextValue>(
    () => ({
      alerts,
      dueRecurrings,
      duePlanLines,
      currency,
      walletNames,
      actingId,
      actionError,
      totalCount,
      panelSource,
      openPanel: (source) => setPanelSource(source),
      closePanel: () => setPanelSource(null),
      togglePanel: (source) =>
        setPanelSource((current) => (current === source ? null : source)),
      registerDue,
      skipDue,
      confirmPlanDue,
      dismissPlanDue,
      reload: loadAlerts,
    }),
    [
      actionError,
      actingId,
      alerts,
      confirmPlanDue,
      currency,
      dismissPlanDue,
      duePlanLines,
      dueRecurrings,
      loadAlerts,
      panelSource,
      registerDue,
      skipDue,
      totalCount,
      walletNames,
    ],
  );

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
}

export function useAlerts() {
  const context = useContext(AlertsContext);

  if (!context) {
    throw new Error("useAlerts must be used within AlertsProvider");
  }

  return context;
}
