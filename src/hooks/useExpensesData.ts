"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  emptyTransactionFilters,
  filterTransactions,
  getSelectedWalletSnapshot,
  loadExpensesPageData,
} from "@/lib/expenses";
import { usePageFeedback } from "@/hooks/usePageFeedback";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useSyncCompleteListener } from "@/hooks/useSyncCompleteListener";
import { useCurrentMonthRange } from "@/hooks/useMonthPeriod";
import { normalizeMonthStartDay } from "@/lib/calendar";
import { createClient } from "@/lib/supabase/client";
import type { Category, Transaction, Wallet } from "@/lib/types/database";
import { isBrowserOnline, saveExpensesCache, type OfflineTransaction } from "@/lib/offline";
import { summarizeTransactions } from "@/lib/utils/summary";

export function useExpensesData() {
  const online = useNetworkStatus();
  const { error, message, setError, setMessage, clearFeedback } = usePageFeedback();

  const [monthStartDay, setMonthStartDay] = useState(1);
  const month = useCurrentMonthRange(monthStartDay);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<OfflineTransaction[]>([]);
  const [balanceTransactions, setBalanceTransactions] = useState<
    Pick<Transaction, "id" | "wallet_id" | "amount" | "type" | "transfer_role">[]
  >([]);
  const [monthTransactions, setMonthTransactions] = useState<OfflineTransaction[]>([]);
  const [filters, setFilters] = useState(() =>
    emptyTransactionFilters(month.start, month.end),
  );
  const [currency, setCurrency] = useState("EGP");
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [usingOfflineCache, setUsingOfflineCache] = useState(false);

  const applySnapshot = useCallback(
    (
      snapshot: {
        currency: string;
        categories: Category[];
        wallets: Wallet[];
        transactions: OfflineTransaction[];
        monthTransactions: OfflineTransaction[];
        balanceTransactions: Pick<
          Transaction,
          "id" | "wallet_id" | "amount" | "type" | "transfer_role"
        >[];
        monthStartDay?: number;
      },
      options?: { fromCache?: boolean },
    ) => {
      setCurrency(snapshot.currency);
      setCategories(snapshot.categories);
      setWallets(snapshot.wallets);
      setTransactions(snapshot.transactions);
      setMonthTransactions(snapshot.monthTransactions);
      setBalanceTransactions(snapshot.balanceTransactions);
      setUsingOfflineCache(Boolean(options?.fromCache));
      setMonthStartDay(normalizeMonthStartDay(snapshot.monthStartDay));
    },
    [],
  );

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const result = await loadExpensesPageData(
      supabase,
      user.id,
      month.start,
      month.end,
      { useNetwork: isBrowserOnline() },
    );

    if (result.kind === "offline-missing") {
      setError(result.message);
      setLoading(false);
      return;
    }

    if (result.kind === "offline-cache") {
      applySnapshot(result.snapshot, { fromCache: true });
      setLoading(false);
      return;
    }

    if (result.kind === "error") {
      if (result.fallbackSnapshot) {
        applySnapshot(result.fallbackSnapshot, { fromCache: true });
        setMessage(result.message);
      } else {
        setError(result.message);
      }
      setLoading(false);
      return;
    }

    applySnapshot(result.snapshot, { fromCache: false });
    setAttachmentUrls(result.attachmentUrls);
    setLoading(false);
  }, [applySnapshot, month.end, month.start, setError, setMessage]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setFilters(emptyTransactionFilters(month.start, month.end));
  }, [month.end, month.start]);

  useSyncCompleteListener(loadData);

  const monthSummary = useMemo(
    () => summarizeTransactions(monthTransactions),
    [monthTransactions],
  );

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, filters),
    [transactions, filters],
  );

  const filteredSummary = useMemo(
    () => summarizeTransactions(filteredTransactions),
    [filteredTransactions],
  );

  const persistSnapshot = useCallback(
    async (snapshot: {
      transactions: OfflineTransaction[];
      monthTransactions: OfflineTransaction[];
      balanceTransactions: Pick<
        Transaction,
        "id" | "wallet_id" | "amount" | "type" | "transfer_role"
      >[];
    }) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      await saveExpensesCache({
        userId: user.id,
        cachedAt: new Date().toISOString(),
        currency,
        categories,
        wallets,
        transactions: snapshot.transactions,
        monthTransactions: snapshot.monthTransactions,
        balanceTransactions: snapshot.balanceTransactions,
        monthStart: month.start,
        monthEnd: month.end,
      });
    },
    [categories, currency, month.end, month.start, wallets],
  );

  const ingestCategory = useCallback((category: Category) => {
    setCategories((current) => [...current, category]);
  }, []);

  return {
    online,
    loading,
    usingOfflineCache,
    error,
    message,
    month,
    monthSummary,
    filteredSummary,
    categories,
    setCategories,
    wallets,
    transactions,
    setTransactions,
    monthTransactions,
    setMonthTransactions,
    balanceTransactions,
    setBalanceTransactions,
    filteredTransactions,
    filters,
    setFilters,
    currency,
    attachmentUrls,
    setAttachmentUrls,
    persistSnapshot,
    ingestCategory,
    setError,
    setMessage,
    clearFeedback,
  };
}
