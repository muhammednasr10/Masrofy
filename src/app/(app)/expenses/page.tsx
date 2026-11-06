"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "@/lib/router/navigation";
import ExpensesTransactionLog from "@/components/expenses/ExpensesTransactionLog";
import TransactionFormModal from "@/components/expenses/TransactionFormModal";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { useExpensesPage } from "@/hooks/useExpensesPage";
import { ADD_EXPENSE_QUERY } from "@/lib/expenses/navigation";

function ExpensesPageContent() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const wasSubmittingRef = useRef(false);
  const openedFromQueryRef = useRef(false);

  const {
    loading,
    categories,
    wallets,
    transactions,
    filters,
    setFilters,
    monthStart,
    monthEnd,
    currency,
    amount,
    categoryId,
    walletId,
    type,
    note,
    transactionDate,
    receiptFile,
    attachmentUrls,
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
    handleDelete,
    openEditTransaction,
    closeTransactionModal,
    editingTransactionId,
    ingestCategory,
  } = useExpensesPage();

  useEffect(() => {
    if (openedFromQueryRef.current || loading) {
      return;
    }

    if (searchParams.get(ADD_EXPENSE_QUERY) === "1") {
      openedFromQueryRef.current = true;
      setShowTransactionModal(true);
      router.replace("/expenses", { scroll: false });
    }
  }, [loading, router, searchParams]);

  useEffect(() => {
    if (wasSubmittingRef.current && !submitting && message && !error && showTransactionModal) {
      setShowTransactionModal(false);
      closeTransactionModal();
    }

    wasSubmittingRef.current = submitting;
  }, [submitting, message, error, showTransactionModal, closeTransactionModal]);

  if (loading) {
    return <p className="text-sm text-slate-500">{t("expenses.loading")}</p>;
  }

  return (
    <div className="space-y-6">
      <FeedbackBanner error={error} message={message} />

      <ExpensesTransactionLog
        transactions={transactions}
        wallets={wallets}
        categories={categories}
        currency={currency}
        filters={filters}
        monthStart={monthStart}
        monthEnd={monthEnd}
        attachmentUrls={attachmentUrls}
        onFiltersChange={setFilters}
        onAddTransaction={() => {
          closeTransactionModal();
          setShowTransactionModal(true);
        }}
        onDelete={handleDelete}
        onEdit={(transaction) => {
          openEditTransaction(transaction);
          setShowTransactionModal(true);
        }}
      />

      <TransactionFormModal
        open={showTransactionModal}
        mode={editingTransactionId ? "edit" : "add"}
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
        onClose={() => {
          setShowTransactionModal(false);
          closeTransactionModal();
        }}
        onCategoryCreated={ingestCategory}
      />
    </div>
  );
}

export default function ExpensesPage() {
  const t = useTranslations();

  return (
    <Suspense fallback={<p className="text-sm text-slate-500">{t("expenses.loading")}</p>}>
      <ExpensesPageContent />
    </Suspense>
  );
}
