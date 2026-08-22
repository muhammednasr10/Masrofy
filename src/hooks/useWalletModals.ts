"use client";

import { useCallback, useState } from "react";
import { emptyWalletForm, walletToForm, type WalletFormState } from "@/lib/wallets/form";
import type { Investment, Transaction, Wallet } from "@/lib/types/database";

export function useWalletModals(
  transactions: Transaction[],
  investments: Investment[],
  clearFeedback: () => void,
) {
  const [addForm, setAddForm] = useState<WalletFormState>(emptyWalletForm());
  const [editForm, setEditForm] = useState<WalletFormState | null>(null);
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryFocusWalletId, setInventoryFocusWalletId] = useState<string | null>(null);

  const openInventoryModal = useCallback(
    (walletId: string | null = null) => {
      setInventoryFocusWalletId(walletId);
      setShowInventoryModal(true);
      clearFeedback();
    },
    [clearFeedback],
  );

  const closeInventoryModal = useCallback(() => {
    setShowInventoryModal(false);
    setInventoryFocusWalletId(null);
  }, []);

  const openEditModal = useCallback(
    (wallet: Wallet) => {
      setEditingWalletId(wallet.id);
      setEditForm(walletToForm(wallet, transactions, investments));
      clearFeedback();
    },
    [transactions, investments, clearFeedback],
  );

  const closeEditModal = useCallback(() => {
    setEditingWalletId(null);
    setEditForm(null);
  }, []);

  const openAddModal = useCallback(
    (parentWalletId: string | null = null) => {
      setAddForm(emptyWalletForm(parentWalletId));
      setShowAddModal(true);
      clearFeedback();
    },
    [clearFeedback],
  );

  const closeAddModal = useCallback(() => {
    setShowAddModal(false);
    setAddForm(emptyWalletForm());
  }, []);

  return {
    addForm,
    editForm,
    editingWalletId,
    showAddModal,
    showInventoryModal,
    inventoryFocusWalletId,
    setAddForm,
    setEditForm,
    openInventoryModal,
    closeInventoryModal,
    openEditModal,
    closeEditModal,
    openAddModal,
    closeAddModal,
  };
}
