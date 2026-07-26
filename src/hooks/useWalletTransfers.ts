"use client";

import { FormEvent, useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { executeWalletTransfer } from "@/lib/wallets/transfer-service";
import {
  emptyWalletTransferForm,
  type WalletTransferFormState,
} from "@/lib/wallets/transfer";
import type { InternalWalletTransfer, Transaction } from "@/lib/types/database";

type UseWalletTransfersOptions = {
  defaultWalletId: string;
  onBalanceTransactionsChange: (transactions: Transaction[]) => void;
  setError: (message: string | null) => void;
  setMessage: (message: string | null) => void;
  clearFeedback: () => void;
};

export function useWalletTransfers({
  defaultWalletId,
  onBalanceTransactionsChange,
  setError,
  setMessage,
  clearFeedback,
}: UseWalletTransfersOptions) {
  const [internalTransfers, setInternalTransfers] = useState<InternalWalletTransfer[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState<WalletTransferFormState>(
    emptyWalletTransferForm(),
  );
  const [transferring, setTransferring] = useState(false);

  const setTransferHistory = useCallback((rows: InternalWalletTransfer[]) => {
    setInternalTransfers(rows);
  }, []);

  const openTransferModal = useCallback(() => {
    clearFeedback();
    setTransferForm(emptyWalletTransferForm(defaultWalletId));
    setShowTransferModal(true);
  }, [clearFeedback, defaultWalletId]);

  const closeTransferModal = useCallback(() => {
    setShowTransferModal(false);
  }, []);

  async function handleTransferSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTransferring(true);
    clearFeedback();

    try {
      const supabase = createClient();
      const { transfer, balanceTransactions } = await executeWalletTransfer(
        supabase,
        transferForm,
      );

      if (transfer) {
        setInternalTransfers((current) => [transfer, ...current]);
      }

      onBalanceTransactionsChange(balanceTransactions);
      setShowTransferModal(false);
      setTransferForm(emptyWalletTransferForm(defaultWalletId));
      setMessage("تم التحويل بين المحافظ.");
    } catch (transferError) {
      setError(transferError instanceof Error ? transferError.message : "تعذر تنفيذ التحويل.");
    } finally {
      setTransferring(false);
    }
  }

  return {
    internalTransfers,
    showTransferModal,
    transferForm,
    transferring,
    setTransferForm,
    setTransferHistory,
    openTransferModal,
    closeTransferModal,
    handleTransferSubmit,
  };
}
