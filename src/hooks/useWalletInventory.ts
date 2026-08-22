"use client";

import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Transaction, Wallet } from "@/lib/types/database";
import {
  buildInventoryDisplayRows,
  buildReconciliationPreview,
  calculateWalletBalance,
  getInventoryNetAdjustment,
} from "@/lib/wallets";

export type WalletInventoryPreview = {
  wallet: Wallet;
  actualBalance: number;
  recordedBalance: number;
  difference: number;
  isMatched: boolean;
};

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
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getActualBalanceInput(wallet: Wallet) {
    const edited = actualBalanceEdits[wallet.id];

    if (edited !== undefined) {
      return edited;
    }

    return String(calculateWalletBalance(wallet, transactions));
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const trimmedNote = note.trim() || null;

    const { error: reconcileError } = await supabase.rpc("reconcile_wallets_batch", {
      p_items: previews.map((preview) => ({
        wallet_id: preview.wallet.id,
        actual_balance: preview.actualBalance,
      })),
      p_note: trimmedNote,
    });

    if (reconcileError) {
      setError(reconcileError.message);
      setSaving(false);
      return;
    }

    await onComplete();
    onClose();
  }

  return {
    walletRows,
    editableWallets,
    previews,
    summary,
    focusWallet,
    note,
    saving,
    error,
    setNote,
    getActualBalanceInput,
    updateActualBalance,
    handleSubmit,
  };
}
