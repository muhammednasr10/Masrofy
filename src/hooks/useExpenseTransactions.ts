"use client";

import { FormEvent, useCallback, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  deleteExpenseTransactions,
  importExpenseTransactions,
  saveExpenseLines,
  submitExpenseTransaction,
  type ExpenseTransactionCommandContext,
} from "@/hooks/expense-transaction-commands";
import { useRouter } from "@/lib/router/navigation";
import { appendTransactionToSnapshot, getSelectedWalletSnapshot } from "@/lib/expenses";
import type { ReadyTransactionDraft } from "@/lib/expenses/batch-draft";
import type { ParsedImportRow } from "@/lib/expenses/import-csv";
import type { Category, Transaction, TransactionType, Wallet } from "@/lib/types/database";
import type { OfflineTransaction } from "@/lib/offline";

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

  function commandContext(): ExpenseTransactionCommandContext {
    return {
      data,
      walletId,
      categoryId,
      amount,
      type,
      note,
      transactionDate,
      receiptFile,
      editingTransactionId,
      categories,
      setSubmitting,
      clearFeedback,
      setError,
      setMessage,
      setTransactions,
      setMonthTransactions,
      setBalanceTransactions,
      setAttachmentUrls,
      persistSnapshot,
      resetTransactionForm,
      ingestTransaction,
      router,
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    return submitExpenseTransaction(event, commandContext());
  }

  function handleSaveLines(lines: ReadyTransactionDraft[]) {
    return saveExpenseLines(lines, commandContext());
  }

  function handleImportTransactions(rows: ParsedImportRow[], importWalletId: string) {
    return importExpenseTransactions(rows, importWalletId, commandContext());
  }

  function handleDelete(ids: string | string[]) {
    const list = Array.isArray(ids) ? ids : [ids];
    return deleteExpenseTransactions(list, commandContext());
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
    handleSaveLines,
    handleDelete,
    handleImportTransactions,
    openEditTransaction,
    closeTransactionModal,
    ingestTransaction,
    ingestCategory: ingestCategoryWithSelection,
  };
}
