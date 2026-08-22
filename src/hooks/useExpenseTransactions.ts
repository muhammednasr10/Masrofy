"use client";

import { FormEvent, useCallback, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import {
  appendTransactionToSnapshot,
  removeTransactionFromSnapshot,
  updateTransactionInSnapshot,
} from "@/lib/expenses";
import type { ParsedImportRow } from "@/lib/expenses/import-csv";
import {
  deleteTransactionAttachments,
  uploadTransactionReceipt,
} from "@/lib/attachments";
import { createClient } from "@/lib/supabase/client";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import type { Category, Transaction, TransactionType, Wallet } from "@/lib/types/database";
import {
  buildLocalTransaction,
  enqueueTransactionInsert,
  isBrowserOnline,
  saveExpensesCache,
  type OfflineTransaction,
} from "@/lib/offline";
import { getSelectedWalletSnapshot } from "@/lib/expenses";

type ExpensesSnapshot = {
  currency: string;
  categories: Category[];
  wallets: Wallet[];
  transactions: OfflineTransaction[];
  monthTransactions: OfflineTransaction[];
  balanceTransactions: Pick<
    Transaction,
    "id" | "wallet_id" | "amount" | "type" | "transfer_role"
  >[];
};

type UseExpenseTransactionsOptions = {
  data: ExpensesSnapshot & {
    monthStart: string;
    monthEnd: string;
  };
  setTransactions: Dispatch<SetStateAction<OfflineTransaction[]>>;
  setMonthTransactions: Dispatch<SetStateAction<OfflineTransaction[]>>;
  setBalanceTransactions: Dispatch<
    SetStateAction<
      Pick<Transaction, "id" | "wallet_id" | "amount" | "type" | "transfer_role">[]
    >
  >;
  setAttachmentUrls: Dispatch<SetStateAction<Record<string, string>>>;
  persistSnapshot: (snapshot: {
    transactions: OfflineTransaction[];
    monthTransactions: OfflineTransaction[];
    balanceTransactions: Pick<
      Transaction,
      "id" | "wallet_id" | "amount" | "type" | "transfer_role"
    >[];
  }) => Promise<void>;
  setError: (message: string | null) => void;
  setMessage: (message: string | null) => void;
  clearFeedback: () => void;
  ingestCategory: (category: Category) => void;
  categories: Category[];
};

export function useExpenseTransactions({
  data,
  setTransactions,
  setMonthTransactions,
  setBalanceTransactions,
  setAttachmentUrls,
  persistSnapshot,
  setError,
  setMessage,
  clearFeedback,
  ingestCategory,
  categories,
}: UseExpenseTransactionsOptions) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [note, setNote] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  const selectedWalletSnapshot = useMemo(
    () =>
      walletId
        ? getSelectedWalletSnapshot(data.wallets, walletId, data.balanceTransactions)
        : null,
    [data.balanceTransactions, data.wallets, walletId],
  );

  const ingestTransaction = useCallback(
    (savedTransaction: OfflineTransaction) => {
      const nextSnapshot = appendTransactionToSnapshot(
        data,
        savedTransaction,
        data.monthStart,
        data.monthEnd,
      );

      setTransactions(nextSnapshot.transactions);
      setMonthTransactions(nextSnapshot.monthTransactions);
      setBalanceTransactions(nextSnapshot.balanceTransactions);
      void persistSnapshot(nextSnapshot);
    },
    [
      data,
      persistSnapshot,
      setBalanceTransactions,
      setMonthTransactions,
      setTransactions,
    ],
  );

  function handleTypeChange(nextType: TransactionType) {
    setType(nextType);

    if (nextType === "income") {
      return;
    }

    if (!categoryId && categories[0]) {
      setCategoryId(categories[0].id);
    }
  }

  function resetTransactionForm() {
    setAmount("");
    setNote("");
    setReceiptFile(null);
    setType("expense");
    setTransactionDate(new Date().toISOString().slice(0, 10));
    setEditingTransactionId(null);

    if (categories[0]) {
      setCategoryId(categories[0].id);
    }

    const defaultWallet =
      data.wallets.find((wallet) => wallet.is_default) ?? data.wallets[0];
    if (defaultWallet) {
      setWalletId(defaultWallet.id);
    }
  }

  function openEditTransaction(transaction: OfflineTransaction) {
    if (transaction.type === "transfer") {
      setError("لا يمكن تعديل عمليات التحويل من هنا.");
      return;
    }

    if (transaction.offlinePending) {
      setError("لا يمكن تعديل عملية محفوظة محلياً قبل مزامنتها.");
      return;
    }

    clearFeedback();
    setEditingTransactionId(transaction.id);
    setAmount(String(transaction.amount));
    setCategoryId(transaction.category_id ?? "");
    setWalletId(transaction.wallet_id ?? "");
    setType(transaction.type === "income" ? "income" : "expense");
    setNote(transaction.note ?? "");
    setTransactionDate(transaction.transaction_date);
    setReceiptFile(null);
  }

  function closeTransactionModal() {
    resetTransactionForm();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    clearFeedback();

    if (!walletId) {
      setError("يجب اختيار محفظة.");
      setSubmitting(false);
      return;
    }

    const supabase = createClient();
    const isEditing = Boolean(editingTransactionId);

    try {
      const user = await requireAuthenticatedUser(supabase);
      const payload = {
        wallet_id: walletId,
        category_id: categoryId || null,
        amount: Number(amount),
        type,
        note: note.trim() || null,
        transaction_date: transactionDate,
      };

      if (isEditing) {
        if (!isBrowserOnline()) {
          setError("تعديل العمليات يحتاج اتصالاً بالإنترنت.");
          return;
        }

        const { data: updatedRow, error: updateError } = await supabase
          .from("transactions")
          .update(payload)
          .eq("id", editingTransactionId)
          .select("*, categories(name, icon, color), wallets(name, icon, color)")
          .single();

        if (updateError) {
          throw updateError;
        }

        const updatedTransaction = updatedRow as Transaction;

        if (receiptFile) {
          const signedUrl = await uploadTransactionReceipt(
            supabase,
            user.id,
            updatedTransaction.id,
            receiptFile,
          );

          if (signedUrl) {
            setAttachmentUrls((current) => ({
              ...current,
              [updatedTransaction.id]: signedUrl,
            }));
          }
        }

        const nextSnapshot = updateTransactionInSnapshot(
          data,
          updatedTransaction,
          data.monthStart,
          data.monthEnd,
        );

        setTransactions(nextSnapshot.transactions);
        setMonthTransactions(nextSnapshot.monthTransactions);
        setBalanceTransactions(nextSnapshot.balanceTransactions);
        void persistSnapshot(nextSnapshot);
        resetTransactionForm();
        setMessage("تم تحديث العملية بنجاح.");
        router.refresh();
        return;
      }

      if (!isBrowserOnline()) {
        if (receiptFile) {
          setError("رفع المرفقات يحتاج اتصالاً بالإنترنت.");
          return;
        }

        const clientTransactionId = crypto.randomUUID();
        await enqueueTransactionInsert(user.id, clientTransactionId, payload);
        ingestTransaction(
          buildLocalTransaction(user.id, clientTransactionId, payload, categories, data.wallets),
        );
        resetTransactionForm();
        setMessage("تم الحفظ محلياً — سيتم رفع العملية عند عودة الإنترنت.");
        return;
      }

      const { data: insertedRow, error: insertError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          ...payload,
        })
        .select("*, categories(name, icon, color), wallets(name, icon, color)")
        .single();

      if (insertError) {
        throw insertError;
      }

      const savedTransaction = insertedRow as Transaction;

      if (receiptFile) {
        const signedUrl = await uploadTransactionReceipt(
          supabase,
          user.id,
          savedTransaction.id,
          receiptFile,
        );

        if (signedUrl) {
          setAttachmentUrls((current) => ({
            ...current,
            [savedTransaction.id]: signedUrl,
          }));
        }
      }

      ingestTransaction(savedTransaction);
      resetTransactionForm();
      setMessage("تم حفظ العملية بنجاح.");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "تعذر حفظ العملية.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleImportTransactions(rows: ParsedImportRow[], importWalletId: string) {
    clearFeedback();

    if (!importWalletId) {
      setError("يجب اختيار محفظة للاستيراد.");
      return;
    }

    if (!isBrowserOnline()) {
      setError("استيراد العمليات يحتاج اتصالاً بالإنترنت.");
      return;
    }

    if (rows.length === 0) {
      setError("لا توجد عمليات صالحة للاستيراد.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    try {
      const user = await requireAuthenticatedUser(supabase);

      const inserts = rows.map((row) => ({
        user_id: user.id,
        wallet_id: importWalletId,
        category_id:
          row.categoryName != null
            ? categories.find(
                (category) =>
                  category.name.trim().toLowerCase() === row.categoryName?.trim().toLowerCase(),
              )?.id ?? null
            : null,
        amount: row.amount,
        type: row.type,
        note: row.note,
        transaction_date: row.transaction_date,
      }));

      const { data: insertedRows, error: insertError } = await supabase
        .from("transactions")
        .insert(inserts)
        .select("*, categories(name, icon, color), wallets(name, icon, color)");

      if (insertError) {
        throw insertError;
      }

      let nextSnapshot: typeof data = { ...data };

      for (const savedTransaction of (insertedRows ?? []) as Transaction[]) {
        nextSnapshot = {
          ...nextSnapshot,
          ...appendTransactionToSnapshot(
            nextSnapshot,
            savedTransaction,
            data.monthStart,
            data.monthEnd,
          ),
        };
      }

      setTransactions(nextSnapshot.transactions);
      setMonthTransactions(nextSnapshot.monthTransactions);
      setBalanceTransactions(nextSnapshot.balanceTransactions);
      void persistSnapshot(nextSnapshot);
      setMessage(`تم استيراد ${(insertedRows ?? []).length} عملية بنجاح.`);
      router.refresh();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "تعذر استيراد العمليات.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    clearFeedback();

    const deletedTransaction = data.transactions.find((transaction) => transaction.id === id);

    if (deletedTransaction?.offlinePending) {
      setError("لا يمكن حذف عملية محفوظة محلياً قبل مزامنتها.");
      return;
    }

    if (!isBrowserOnline()) {
      setError("حذف العمليات يحتاج اتصالاً بالإنترنت.");
      return;
    }

    const supabase = createClient();

    try {
      await deleteTransactionAttachments(supabase, id);

      const { error: deleteError } = await supabase.from("transactions").delete().eq("id", id);

      if (deleteError) {
        throw deleteError;
      }

      const nextSnapshot = removeTransactionFromSnapshot(data, id);

      setTransactions(nextSnapshot.transactions);
      setMonthTransactions(nextSnapshot.monthTransactions);
      setBalanceTransactions(nextSnapshot.balanceTransactions);
      setAttachmentUrls((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });

      setMessage("تم حذف العملية.");
      router.refresh();
    } catch (deleteFailure) {
      setError(deleteFailure instanceof Error ? deleteFailure.message : "تعذر حذف العملية.");
    }
  }

  const ingestCategoryWithSelection = useCallback(
    (category: Category) => {
      ingestCategory(category);
      setCategoryId(category.id);
    },
    [ingestCategory],
  );

  return {
    amount,
    categoryId,
    walletId,
    type,
    note,
    transactionDate,
    receiptFile,
    submitting,
    editingTransactionId,
    selectedWalletSnapshot,
    setAmount,
    setCategoryId,
    setWalletId,
    handleTypeChange,
    setNote,
    setReceiptFile,
    setTransactionDate,
    handleSubmit,
    handleDelete,
    handleImportTransactions,
    openEditTransaction,
    closeTransactionModal,
    ingestTransaction,
    ingestCategory: ingestCategoryWithSelection,
  };
}
