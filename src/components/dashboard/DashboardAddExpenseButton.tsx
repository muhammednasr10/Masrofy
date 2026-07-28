"use client";

import { useEffect, useRef, useState } from "react";
import TransactionFormModal from "@/components/expenses/TransactionFormModal";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useExpensesPage } from "@/hooks/useExpensesPage";

type DashboardAddExpenseModalProps = {
  onClose: () => void;
};

function DashboardAddExpenseModal({ onClose }: DashboardAddExpenseModalProps) {
  const wasSubmittingRef = useRef(false);

  const {
    loading,
    categories,
    wallets,
    currency,
    amount,
    categoryId,
    walletId,
    type,
    note,
    transactionDate,
    receiptFile,
    submitting,
    error,
    message,
    selectedWalletSnapshot,
    setAmount,
    setCategoryId,
    setWalletId,
    handleTypeChange,
    setNote,
    setReceiptFile,
    setTransactionDate,
    handleSubmit,
    ingestCategory,
  } = useExpensesPage();

  useEffect(() => {
    if (wasSubmittingRef.current && !submitting && message && !error) {
      onClose();
    }

    wasSubmittingRef.current = submitting;
  }, [submitting, message, error, onClose]);

  return (
    <TransactionFormModal
      open={!loading}
      categories={categories}
      wallets={wallets}
      currency={currency}
      amount={amount}
      categoryId={categoryId}
      walletId={walletId}
      type={type}
      note={note}
      transactionDate={transactionDate}
      receiptFile={receiptFile}
      submitting={submitting}
      selectedWalletSnapshot={selectedWalletSnapshot}
      onAmountChange={setAmount}
      onCategoryChange={setCategoryId}
      onWalletChange={setWalletId}
      onTypeChange={handleTypeChange}
      onNoteChange={setNote}
      onReceiptChange={setReceiptFile}
      onTransactionDateChange={setTransactionDate}
      onSubmit={handleSubmit}
      onClose={onClose}
      onCategoryCreated={ingestCategory}
    />
  );
}

export default function DashboardAddExpenseButton() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
      >
        + {t("expenses.addExpense")}
      </button>

      {open ? <DashboardAddExpenseModal onClose={() => setOpen(false)} /> : null}
    </>
  );
}
