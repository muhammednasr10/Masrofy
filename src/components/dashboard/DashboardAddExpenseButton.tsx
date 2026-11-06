"use client";

import { useEffect, useRef, useState } from "react";
import QuickAddExpenseSheet from "@/components/expenses/QuickAddExpenseSheet";
import TransactionFormModal from "@/components/expenses/TransactionFormModal";
import ModalShell from "@/components/ui/ModalShell";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useExpensesPage } from "@/hooks/useExpensesPage";
import { QUICK_ADD_EVENT } from "@/lib/expenses/quick-add";

type DashboardAddExpenseModalProps = {
  onClose: () => void;
};

function DashboardAddExpenseModal({ onClose }: DashboardAddExpenseModalProps) {
  const t = useTranslations();
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
    handleSaveLines,
    ingestCategory,
  } = useExpensesPage();

  useEffect(() => {
    if (wasSubmittingRef.current && !submitting && message && !error) {
      onClose();
    }

    wasSubmittingRef.current = submitting;
  }, [submitting, message, error, onClose]);

  if (loading) {
    return (
      <ModalShell onClose={onClose} dialog maxWidthClassName="max-w-3xl">
        <p className="text-sm text-slate-500">{t("common.loading")}</p>
      </ModalShell>
    );
  }

  return (
    <TransactionFormModal
      open
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
      onSaveLines={handleSaveLines}
      onClose={onClose}
      onCategoryCreated={ingestCategory}
    />
  );
}

export default function DashboardAddExpenseButton() {
  const t = useTranslations();
  const [quickOpen, setQuickOpen] = useState(false);
  const [fullOpen, setFullOpen] = useState(false);
  const [presetCategoryId, setPresetCategoryId] = useState<string | null>(null);

  useEffect(() => {
    function handleQuickAdd(event: Event) {
      const categoryId = (event as CustomEvent<{ categoryId?: string }>).detail?.categoryId ?? null;
      setPresetCategoryId(categoryId);
      setFullOpen(false);
      setQuickOpen(true);
    }

    window.addEventListener(QUICK_ADD_EVENT, handleQuickAdd);
    return () => window.removeEventListener(QUICK_ADD_EVENT, handleQuickAdd);
  }, []);

  function openAddForm() {
    setQuickOpen(false);
    setPresetCategoryId(null);
    setFullOpen(true);
  }

  function closeQuickAdd() {
    setQuickOpen(false);
    setPresetCategoryId(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={openAddForm}
        aria-label={t("expenses.addExpense")}
        title={t("expenses.addExpense")}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xl font-light leading-none text-white transition hover:bg-emerald-700"
      >
        <span aria-hidden>+</span>
      </button>

      {quickOpen ? (
        <QuickAddExpenseSheet
          initialCategoryId={presetCategoryId}
          onClose={closeQuickAdd}
          onOpenFullForm={() => {
            closeQuickAdd();
            setFullOpen(true);
          }}
        />
      ) : null}

      {fullOpen ? <DashboardAddExpenseModal onClose={() => setFullOpen(false)} /> : null}
    </>
  );
}
