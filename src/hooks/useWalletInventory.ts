"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category, Transaction, Wallet } from "@/lib/types/database";
import { formatMoneyInput } from "@/lib/utils/money";
import {
  buildInventoryDisplayRows,
  buildReconciliationPreview,
  calculateWalletBalance,
  getInventoryNetAdjustment,
} from "@/lib/wallets";
import {
  applyWalletInventoryBalance,
  type InventoryDifferenceClassification,
} from "@/lib/wallets/set-current-balance";

export type WalletInventoryPreview = {
  wallet: Wallet;
  actualBalance: number;
  recordedBalance: number;
  difference: number;
  isMatched: boolean;
};

export type DifferenceClassification = InventoryDifferenceClassification;

export function useWalletInventory(
  wallets: Wallet[],
  transactions: Transaction[],
  focusWalletId: string | null,
  onComplete: () => Promise<void>,
  onClose: () => void,
) {
  const walletRows = useMemo(
    () => buildInventoryDisplayRows(wallets, focusWalletId),
    [focusWalletId, wallets],
  );

  const editableWallets = useMemo(
    () => walletRows.filter((row) => row.editable).map((row) => row.wallet),
    [walletRows],
  );

  const [actualBalanceEdits, setActualBalanceEdits] = useState<Record<string, string>>({});
  const [classifications, setClassifications] = useState<
    Record<string, DifferenceClassification>
  >({});
  const [categoryIds, setCategoryIds] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setCategories((data ?? []) as Category[]);
      });
  }, []);

  function getActualBalanceInput(wallet: Wallet) {
    const edited = actualBalanceEdits[wallet.id];

    if (edited !== undefined) {
      return edited;
    }

    return formatMoneyInput(calculateWalletBalance(wallet, transactions));
  }

  const previews = useMemo(() => {
    return editableWallets.map((wallet) => {
      const actualBalance = Number(getActualBalanceInput(wallet)) || 0;

      return {
        wallet,
        ...buildReconciliationPreview(wallet, transactions, actualBalance),
      };
    });
  }, [editableWallets, actualBalanceEdits, transactions]);

  const summary = useMemo(() => {
    const mismatched = previews.filter((preview) => !preview.isMatched);
    const netAdjustment = getInventoryNetAdjustment(previews);

    return {
      total: previews.length,
      matched: previews.length - mismatched.length,
      mismatched: mismatched.length,
      netAdjustment,
    };
  }, [previews]);

  const focusWallet = focusWalletId
    ? wallets.find((wallet) => wallet.id === focusWalletId)
    : null;

  function updateActualBalance(walletId: string, actualBalance: string) {
    setActualBalanceEdits((current) => ({
      ...current,
      [walletId]: actualBalance,
    }));
  }

  function setClassification(walletId: string, value: DifferenceClassification) {
    setClassifications((current) => ({ ...current, [walletId]: value }));

    if (value === "unknown") {
      setCategoryIds((current) => {
        const next = { ...current };
        delete next[walletId];
        return next;
      });
    }
  }

  function setCategoryId(walletId: string, categoryId: string) {
    setCategoryIds((current) => ({ ...current, [walletId]: categoryId }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const mismatched = previews.filter((preview) => !preview.isMatched);

    for (const preview of mismatched) {
      const classification = classifications[preview.wallet.id] ?? "unknown";

      if (classification === "known" && !categoryIds[preview.wallet.id]) {
        setError(`اختَر فئة للفرق في «${preview.wallet.name}».`);
        setSaving(false);
        return;
      }
    }

    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("يجب تسجيل الدخول أولاً.");
      }

      for (const preview of mismatched) {
        const classification = classifications[preview.wallet.id] ?? "unknown";

        await applyWalletInventoryBalance(supabase, preview.wallet, preview.actualBalance, {
          userId: user.id,
          classification,
          categoryId: categoryIds[preview.wallet.id] ?? null,
          note,
        });
      }

      await onComplete();
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر تحديث الأرصدة.");
      setSaving(false);
      return;
    }

    setSaving(false);
  }

  return {
    walletRows,
    editableWallets,
    previews,
    summary,
    focusWallet,
    categories,
    classifications,
    categoryIds,
    note,
    saving,
    error,
    setNote,
    getActualBalanceInput,
    updateActualBalance,
    setClassification,
    setCategoryId,
    handleSubmit,
  };
}
