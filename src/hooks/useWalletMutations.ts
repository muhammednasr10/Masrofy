"use client";

import { FormEvent, useCallback, useState, type Dispatch, type SetStateAction } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Investment, Transaction, Wallet } from "@/lib/types/database";
import {
  buildWalletPayload,
  getWalletParentId,
  openingBalanceFromCurrentBalance,
  sortWallets,
  walletHasChildren,
  type WalletFormState,
} from "@/lib/wallets";

type WalletMutationFeedback = {
  setError: (message: string | null) => void;
  setMessage: (message: string | null) => void;
  clearFeedback: () => void;
};

type UseWalletMutationsOptions = WalletMutationFeedback & {
  wallets: Wallet[];
  setWallets: Dispatch<SetStateAction<Wallet[]>>;
  transactions: Transaction[];
  investments: Investment[];
  addForm: WalletFormState;
  editForm: WalletFormState | null;
  editingWalletId: string | null;
  defaultWalletId: string;
  closeAddModal: () => void;
  closeEditModal: () => void;
  loadData: () => Promise<void>;
};

export function useWalletMutations({
  wallets,
  setWallets,
  transactions,
  addForm,
  editForm,
  editingWalletId,
  defaultWalletId,
  closeAddModal,
  closeEditModal,
  loadData,
  setError,
  setMessage,
  clearFeedback,
}: UseWalletMutationsOptions) {
  const [adding, setAdding] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const persistSiblingOrder = useCallback(
    async (siblings: Wallet[]) => {
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
    },
    [loadData, setError, setWallets],
  );

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
    [addForm, wallets, clearFeedback, closeAddModal, setError, setMessage, setWallets],
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
    [
      editingWalletId,
      editForm,
      transactions,
      clearFeedback,
      closeEditModal,
      setError,
      setMessage,
      setWallets,
    ],
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
    [defaultWalletId, setError, setMessage, setWallets],
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
    [
      wallets,
      transactions,
      editingWalletId,
      closeEditModal,
      persistSiblingOrder,
      setError,
      setWallets,
    ],
  );

  return {
    adding,
    savingEdit,
    reorderingId,
    handleAddSubmit,
    handleEditSubmit,
    handleMoveWallet,
    handleSetDefault,
    handleDelete,
  };
}
