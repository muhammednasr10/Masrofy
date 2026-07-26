"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePageFeedback } from "@/hooks/usePageFeedback";
import { useWalletTransfers } from "@/hooks/useWalletTransfers";
import type { InternalWalletTransfer, Investment, Transaction, Wallet, WalletReconciliation } from "@/lib/types/database";
import { getTransferableWallets } from "@/lib/wallets/transfer";
import {
  buildWalletDisplayRows,
  buildWalletPayload,
  buildWalletTableRows,
  emptyWalletForm,
  getLatestReconciliationsByWallet,
  getParentWallets,
  getReconcilableWallets,
  getWalletParentId,
  normalizeWallets,
  openingBalanceFromCurrentBalance,
  sortWallets,
  summarizePortfolioWealth,
  walletHasChildren,
  walletToForm,
  type WalletFormState,
} from "@/lib/wallets";

export function useWalletsPage() {
  const { error, message, setError, setMessage, clearFeedback } = usePageFeedback();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currency, setCurrency] = useState("EGP");
  const [addForm, setAddForm] = useState<WalletFormState>(emptyWalletForm());
  const [editForm, setEditForm] = useState<WalletFormState | null>(null);
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [reconciliations, setReconciliations] = useState<WalletReconciliation[]>([]);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryFocusWalletId, setInventoryFocusWalletId] = useState<string | null>(null);

  const defaultWalletId = useMemo(
    () => wallets.find((wallet) => wallet.is_default)?.id ?? wallets[0]?.id ?? "",
    [wallets],
  );

  const transfers = useWalletTransfers({
    defaultWalletId,
    onBalanceTransactionsChange: setTransactions,
    setError,
    setMessage,
    clearFeedback,
  });

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const [
      { data: profile },
      walletResult,
      { data: transactionRows },
      { data: investmentRows },
      reconciliationResult,
      internalTransferResult,
    ] = await Promise.all([
      supabase.from("profiles").select("currency").maybeSingle(),
      supabase.from("wallets").select("*").order("sort_order", { ascending: true }),
      supabase.from("transactions").select("id, wallet_id, amount, type, transfer_role"),
      supabase.from("investments").select("*").order("sort_order", { ascending: true }),
      supabase
        .from("wallet_reconciliations")
        .select("*, wallets(name, icon, color)")
        .order("reconciled_at", { ascending: false })
        .limit(30),
      supabase
        .from("internal_wallet_transfers")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (walletResult.error) {
      setError(walletResult.error.message);
    }

    setCurrency(profile?.currency ?? "EGP");
    setWallets(sortWallets(normalizeWallets((walletResult.data ?? []) as Wallet[])));
    setInvestments((investmentRows ?? []) as Investment[]);
    setTransactions((transactionRows ?? []) as Transaction[]);
    setReconciliations(
      reconciliationResult.error
        ? []
        : ((reconciliationResult.data ?? []) as WalletReconciliation[]),
    );
    transfers.setTransferHistory(
      internalTransferResult.error
        ? []
        : ((internalTransferResult.data ?? []) as InternalWalletTransfer[]),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const walletRows = useMemo(() => buildWalletDisplayRows(wallets), [wallets]);
  const tableRows = useMemo(() => buildWalletTableRows(wallets), [wallets]);
  const parentWallets = useMemo(() => getParentWallets(wallets), [wallets]);
  const reconcilableWalletIds = useMemo(
    () => new Set(getReconcilableWallets(wallets).map((wallet) => wallet.id)),
    [wallets],
  );
  const latestReconciliations = useMemo(
    () => getLatestReconciliationsByWallet(reconciliations),
    [reconciliations],
  );
  const portfolioSummary = useMemo(
    () => summarizePortfolioWealth(wallets, transactions, investments),
    [wallets, transactions, investments],
  );
  const takenInvestmentIds = useMemo(
    () =>
      new Set(
        wallets
          .filter((wallet) => wallet.investment_id && wallet.id !== editingWalletId)
          .map((wallet) => wallet.investment_id as string),
      ),
    [wallets, editingWalletId],
  );

  const transferableWallets = useMemo(() => getTransferableWallets(wallets), [wallets]);

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

  const persistSiblingOrder = useCallback(async (siblings: Wallet[]) => {
    const supabase = createClient();
    const updates = siblings.map((wallet, index) =>
      supabase
        .from("wallets")
        .update({ sort_order: index + 1 })
        .eq("id", wallet.id),
    );

    const results = await Promise.all(updates);
    const failed = results.find((result) => result.error);

    if (failed?.error) {
      setError(failed.error.message);
      await loadData();
      return;
    }

    setWallets((current) =>
      sortWallets(
        current.map((wallet) => {
          const siblingIndex = siblings.findIndex((item) => item.id === wallet.id);

          if (siblingIndex === -1) {
            return wallet;
          }

          return { ...wallet, sort_order: siblingIndex + 1 };
        }),
      ),
    );
  }, [loadData]);

  const handleAddSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setAdding(true);
      clearFeedback();

      if (addForm.parentWalletId && !addForm.cardKind) {
        setError("اختر نوع البطاقة للمحفظة الفرعية.");
        setAdding(false);
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("يجب تسجيل الدخول أولاً.");
        setAdding(false);
        return;
      }

      const siblings = wallets.filter(
        (wallet) => getWalletParentId(wallet) === addForm.parentWalletId,
      );
      const nextSortOrder =
        siblings.length > 0
          ? Math.max(...siblings.map((wallet) => wallet.sort_order)) + 1
          : wallets.length > 0
            ? Math.max(...wallets.map((wallet) => wallet.sort_order)) + 1
            : 1;

      const { data, error: insertError } = await supabase
        .from("wallets")
        .insert({
          user_id: user.id,
          ...buildWalletPayload(addForm),
          is_default: wallets.length === 0,
          sort_order: nextSortOrder,
        })
        .select("*")
        .single();

      if (insertError) {
        setError(insertError.message);
        setAdding(false);
        return;
      }

      setWallets((current) => sortWallets([...current, data as Wallet]));
      setMessage(
        addForm.parentWalletId ? "تمت إضافة المحفظة الفرعية." : "تمت إضافة المحفظة بنجاح.",
      );
      closeAddModal();
      setAdding(false);
    },
    [addForm, wallets, clearFeedback, closeAddModal],
  );

  const handleEditSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!editingWalletId || !editForm) {
        return;
      }

      if (editForm.parentWalletId && !editForm.cardKind) {
        setError("اختر نوع البطاقة للمحفظة الفرعية.");
        return;
      }

      setSavingEdit(true);
      clearFeedback();

      const supabase = createClient();
      const payload = buildWalletPayload(editForm);
      const updateData =
        editForm.walletType === "investment"
          ? payload
          : {
              ...payload,
              opening_balance: openingBalanceFromCurrentBalance(
                Number(editForm.currentBalance) || 0,
                {
                  id: editingWalletId,
                  card_kind: editForm.cardKind,
                },
                transactions,
              ),
            };

      const { data, error: updateError } = await supabase
        .from("wallets")
        .update(updateData)
        .eq("id", editingWalletId)
        .select("*")
        .single();

      if (updateError) {
        setError(updateError.message);
        setSavingEdit(false);
        return;
      }

      setWallets((current) =>
        sortWallets(
          current.map((wallet) => (wallet.id === editingWalletId ? (data as Wallet) : wallet)),
        ),
      );
      setMessage("تم تحديث المحفظة بنجاح.");
      closeEditModal();
      setSavingEdit(false);
    },
    [editingWalletId, editForm, transactions, clearFeedback, closeEditModal],
  );

  const handleMoveWallet = useCallback(
    async (walletId: string, direction: "up" | "down") => {
      const wallet = wallets.find((item) => item.id === walletId);

      if (!wallet) {
        return;
      }

      const siblings = sortWallets(
        wallets.filter((item) => getWalletParentId(item) === getWalletParentId(wallet)),
      );
      const index = siblings.findIndex((item) => item.id === walletId);

      if (index === -1) {
        return;
      }

      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= siblings.length) {
        return;
      }

      setReorderingId(walletId);
      const nextSiblings = [...siblings];
      [nextSiblings[index], nextSiblings[targetIndex]] = [
        nextSiblings[targetIndex],
        nextSiblings[index],
      ];

      await persistSiblingOrder(nextSiblings);
      setReorderingId(null);
    },
    [wallets, persistSiblingOrder],
  );

  const handleSetDefault = useCallback(
    async (walletId: string) => {
      if (!walletId || walletId === defaultWalletId) {
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      await supabase.from("wallets").update({ is_default: false }).eq("user_id", user.id);

      const { error: walletError } = await supabase
        .from("wallets")
        .update({ is_default: true })
        .eq("id", walletId);

      if (walletError) {
        setError(walletError.message);
        return;
      }

      await supabase.from("profiles").update({ default_wallet_id: walletId }).eq("id", user.id);

      setWallets((current) =>
        current.map((wallet) => ({
          ...wallet,
          is_default: wallet.id === walletId,
        })),
      );
      setMessage("تم تعيين المحفظة الافتراضية.");
    },
    [defaultWalletId],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (walletHasChildren(id, wallets)) {
        setError("لا يمكن حذف محفظة لها محافظ فرعية. احذف الفرعية أولاً.");
        return;
      }

      const hasTransactions = transactions.some((transaction) => transaction.wallet_id === id);

      if (hasTransactions) {
        setError("لا يمكن حذف محفظة مرتبطة بعمليات.");
        return;
      }

      const supabase = createClient();
      const { error: deleteError } = await supabase.from("wallets").delete().eq("id", id);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      if (editingWalletId === id) {
        closeEditModal();
      }

      const deletedWallet = wallets.find((wallet) => wallet.id === id);
      const remainingSiblings = sortWallets(
        wallets.filter(
          (wallet) =>
            wallet.id !== id &&
            getWalletParentId(wallet) ===
              getWalletParentId(deletedWallet ?? { parent_wallet_id: null }),
        ),
      );

      setWallets((current) => current.filter((wallet) => wallet.id !== id));
      await persistSiblingOrder(remainingSiblings);
    },
    [wallets, transactions, editingWalletId, closeEditModal, persistSiblingOrder],
  );

  return {
    loading,
    currency,
    wallets,
    investments,
    transactions,
    reconciliations,
    internalTransfers: transfers.internalTransfers,
    transferableWallets,
    walletRows,
    tableRows,
    parentWallets,
    takenInvestmentIds,
    reconcilableWalletIds,
    latestReconciliations,
    portfolioSummary,
    defaultWalletId,
    addForm,
    editForm,
    editingWalletId,
    showAddModal,
    showInventoryModal,
    showTransferModal: transfers.showTransferModal,
    transferForm: transfers.transferForm,
    inventoryFocusWalletId,
    adding,
    savingEdit,
    transferring: transfers.transferring,
    reorderingId,
    error,
    message,
    setAddForm,
    setEditForm,
    setTransferForm: transfers.setTransferForm,
    loadData,
    openInventoryModal,
    closeInventoryModal,
    openTransferModal: transfers.openTransferModal,
    closeTransferModal: transfers.closeTransferModal,
    openEditModal,
    closeEditModal,
    openAddModal,
    closeAddModal,
    handleAddSubmit,
    handleEditSubmit,
    handleMoveWallet,
    handleSetDefault,
    handleTransferSubmit: transfers.handleTransferSubmit,
    handleDelete,
  };
}
