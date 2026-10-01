"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useSelectedMonth } from "@/components/month/SelectedMonthProvider";
import { usePageFeedback } from "@/hooks/usePageFeedback";
import { useWalletModals } from "@/hooks/useWalletModals";
import { useWalletMutations } from "@/hooks/useWalletMutations";
import { useSyncCompleteListener } from "@/hooks/useSyncCompleteListener";
import { useWalletTransfers } from "@/hooks/useWalletTransfers";
import { useWalletsDerivedData } from "@/hooks/useWalletsDerivedData";
import { createClient } from "@/lib/supabase/client";
import type { Investment, Transaction, Wallet, WalletReconciliation } from "@/lib/types/database";
import { loadDependentWallets, type DependentWallet } from "@/lib/friends/dependent";
import { loadWalletsPageData } from "@/lib/wallets/load-page-data";

export function useWalletsPage() {
  const { locale } = useLocale();
  const { referenceDate, setMonthStartDay: setSharedMonthStartDay } = useSelectedMonth();
  const { error, message, setError, setMessage, clearFeedback } = usePageFeedback();

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthTransactions, setMonthTransactions] = useState<Transaction[]>([]);
  const [monthStartDay, setMonthStartDay] = useState(1);
  const [currency, setCurrency] = useState("EGP");
  const [reconciliations, setReconciliations] = useState<WalletReconciliation[]>([]);
  const [dependentWallets, setDependentWallets] = useState<DependentWallet[]>([]);
  const [loading, setLoading] = useState(true);

  const modals = useWalletModals(transactions, investments, clearFeedback);

  const derived = useWalletsDerivedData(
    wallets,
    transactions,
    investments,
    reconciliations,
    modals.editingWalletId,
  );

  const transfers = useWalletTransfers({
    defaultWalletId: derived.defaultWalletId,
    onBalanceTransactionsChange: setTransactions,
    setError,
    setMessage,
    clearFeedback,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const data = await loadWalletsPageData(supabase, locale, referenceDate);

    if (data.walletLoadError) {
      setError(data.walletLoadError);
    }

    setCurrency(data.currency);
    setMonthStartDay(data.monthStartDay);
    setSharedMonthStartDay(data.monthStartDay);
    setWallets(data.wallets);
    setInvestments(data.investments);
    setTransactions(data.transactions);
    setMonthTransactions(data.monthTransactions);
    setReconciliations(data.reconciliations);
    transfers.setTransferHistory(data.internalTransfers);
    const dependent = await loadDependentWallets(supabase);
    setDependentWallets(dependent.wallets);
    setLoading(false);
  }, [locale, referenceDate, setError, setSharedMonthStartDay, transfers.setTransferHistory]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useSyncCompleteListener(loadData);

  const mutations = useWalletMutations({
    wallets,
    setWallets,
    transactions,
    investments,
    addForm: modals.addForm,
    editForm: modals.editForm,
    editingWalletId: modals.editingWalletId,
    defaultWalletId: derived.defaultWalletId,
    closeAddModal: modals.closeAddModal,
    closeEditModal: modals.closeEditModal,
    loadData,
    setError,
    setMessage,
    clearFeedback,
  });

  return {
    loading,
    currency,
    dependentWallets,
    wallets,
    investments,
    transactions,
    monthTransactions,
    monthStartDay,
    reconciliations,
    internalTransfers: transfers.internalTransfers,
    transferableWallets: derived.transferableWallets,
    walletRows: derived.walletRows,
    tableRows: derived.tableRows,
    parentWallets: derived.parentWallets,
    takenInvestmentIds: derived.takenInvestmentIds,
    reconcilableWalletIds: derived.reconcilableWalletIds,
    latestReconciliations: derived.latestReconciliations,
    portfolioSummary: derived.portfolioSummary,
    defaultWalletId: derived.defaultWalletId,
    addForm: modals.addForm,
    editForm: modals.editForm,
    editingWalletId: modals.editingWalletId,
    showAddModal: modals.showAddModal,
    showInventoryModal: modals.showInventoryModal,
    showTransferModal: transfers.showTransferModal,
    transferForm: transfers.transferForm,
    inventoryFocusWalletId: modals.inventoryFocusWalletId,
    adding: mutations.adding,
    savingEdit: mutations.savingEdit,
    transferring: transfers.transferring,
    reorderingId: mutations.reorderingId,
    error,
    message,
    setAddForm: modals.setAddForm,
    setEditForm: modals.setEditForm,
    setTransferForm: transfers.setTransferForm,
    loadData,
    openInventoryModal: modals.openInventoryModal,
    closeInventoryModal: modals.closeInventoryModal,
    openTransferModal: transfers.openTransferModal,
    closeTransferModal: transfers.closeTransferModal,
    openEditModal: modals.openEditModal,
    closeEditModal: modals.closeEditModal,
    openAddModal: modals.openAddModal,
    closeAddModal: modals.closeAddModal,
    handleAddSubmit: mutations.handleAddSubmit,
    handleEditSubmit: mutations.handleEditSubmit,
    handleMoveWallet: mutations.handleMoveWallet,
    handleSetDefault: mutations.handleSetDefault,
    handleTransferSubmit: transfers.handleTransferSubmit,
    handleDelete: mutations.handleDelete,
  };
}
