"use client";

import { useEffect } from "react";
import { useExpensesData } from "@/hooks/useExpensesData";
import { useExpenseTransactions } from "@/hooks/useExpenseTransactions";

export function useExpensesPage() {
  const expenses = useExpensesData();

  const transactions = useExpenseTransactions({
    data: {
      currency: expenses.currency,
      categories: expenses.categories,
      wallets: expenses.wallets,
      transactions: expenses.transactions,
      monthTransactions: expenses.monthTransactions,
      balanceTransactions: expenses.balanceTransactions,
      monthStart: expenses.month.start,
      monthEnd: expenses.month.end,
    },
    setTransactions: expenses.setTransactions,
    setMonthTransactions: expenses.setMonthTransactions,
    setBalanceTransactions: expenses.setBalanceTransactions,
    setAttachmentUrls: expenses.setAttachmentUrls,
    persistSnapshot: expenses.persistSnapshot,
    setError: expenses.setError,
    setMessage: expenses.setMessage,
    clearFeedback: expenses.clearFeedback,
    ingestCategory: expenses.ingestCategory,
    categories: expenses.categories,
  });

  useEffect(() => {
    if (expenses.categories[0] && !transactions.categoryId) {
      transactions.setCategoryId(expenses.categories[0].id);
    }

    const defaultWallet =
      expenses.wallets.find((wallet) => wallet.is_default) ?? expenses.wallets[0];

    if (defaultWallet && !transactions.walletId) {
      transactions.setWalletId(defaultWallet.id);
    }
  }, [
    expenses.categories,
    expenses.wallets,
    transactions.categoryId,
    transactions.walletId,
    transactions.setCategoryId,
    transactions.setWalletId,
  ]);

  return {
    loading: expenses.loading,
    online: expenses.online,
    usingOfflineCache: expenses.usingOfflineCache,
    monthLabel: expenses.month.label,
    monthStart: expenses.month.start,
    monthEnd: expenses.month.end,
    monthSummary: expenses.monthSummary,
    filteredSummary: expenses.filteredSummary,
    categories: expenses.categories,
    wallets: expenses.wallets,
    transactions: expenses.filteredTransactions,
    allTransactionsCount: expenses.transactions.length,
    filters: expenses.filters,
    setFilters: expenses.setFilters,
    currency: expenses.currency,
    attachmentUrls: expenses.attachmentUrls,
    error: expenses.error,
    message: expenses.message,
    amount: transactions.amount,
    categoryId: transactions.categoryId,
    walletId: transactions.walletId,
    type: transactions.type,
    note: transactions.note,
    transactionDate: transactions.transactionDate,
    receiptFile: transactions.receiptFile,
    submitting: transactions.submitting,
    selectedWalletSnapshot: transactions.selectedWalletSnapshot,
    setAmount: transactions.setAmount,
    setCategoryId: transactions.setCategoryId,
    setWalletId: transactions.setWalletId,
    handleTypeChange: transactions.handleTypeChange,
    setNote: transactions.setNote,
    setReceiptFile: transactions.setReceiptFile,
    setTransactionDate: transactions.setTransactionDate,
    handleSubmit: transactions.handleSubmit,
    handleDelete: transactions.handleDelete,
    handleImportTransactions: transactions.handleImportTransactions,
    openEditTransaction: transactions.openEditTransaction,
    closeTransactionModal: transactions.closeTransactionModal,
    editingTransactionId: transactions.editingTransactionId,
    ingestTransaction: transactions.ingestTransaction,
    ingestCategory: transactions.ingestCategory,
  };
}
