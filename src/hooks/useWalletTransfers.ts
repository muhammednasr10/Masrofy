"use client";

import { FormEvent, useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  executeWalletTransfer,
  getWalletTransferErrorMessage,
} from "@/lib/wallets/transfer-service";
import {
  prefillWalletTransferForm,
  type WalletTransferFormState,
} from "@/lib/wallets/transfer";
import type { InternalWalletTransfer } from "@/lib/types/database";

type UseWalletTransfersOptions = {
  defaultWalletId: string;
  transferableWalletIds: string[];
  onTransferred: () => Promise<void> | void;
  setError: (message: string | null) => void;
  setMessage: (message: string | null) => void;
  clearFeedback: () => void;
};

export function useWalletTransfers({
  defaultWalletId,
  transferableWalletIds,
  onTransferred,
  setError,
  setMessage,
  clearFeedback,
}: UseWalletTransfersOptions) {
  const [internalTransfers, setInternalTransfers] = useState<InternalWalletTransfer[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState<WalletTransferFormState>(
    prefillWalletTransferForm(transferableWalletIds, defaultWalletId),
  );
  const [transferring, setTransferring] = useState(false);

  const setTransferHistory = useCallback((rows: InternalWalletTransfer[]) => {
    setInternalTransfers(rows);
  }, []);

  const openTransferModal = useCallback(() => {
    clearFeedback();
    setTransferForm(prefillWalletTransferForm(transferableWalletIds, defaultWalletId));
    setShowTransferModal(true);
  }, [clearFeedback, defaultWalletId, transferableWalletIds]);

  const closeTransferModal = useCallback(() => {
    setShowTransferModal(false);
  }, []);

  async function handleTransferSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTransferring(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createClient();
      const { transfer } = await executeWalletTransfer(supabase, transferForm);

      if (transfer) {
        setInternalTransfers((current) => [transfer, ...current]);
      }

      setShowTransferModal(false);
      setTransferForm(prefillWalletTransferForm(transferableWalletIds, defaultWalletId));
      setMessage("تم التحويل بين المحافظ.");
      await onTransferred();
    } catch (transferError) {
      setError(getWalletTransferErrorMessage(transferError));
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
