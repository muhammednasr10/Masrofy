"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "@/lib/router/navigation";
import ExpensesSummaryCard from "@/components/expenses/ExpensesSummaryCard";
import ExpensesTransactionLog from "@/components/expenses/ExpensesTransactionLog";
import RecurringTransactionFormModal from "@/components/expenses/RecurringTransactionFormModal";
import RecurringTransactionsSection from "@/components/expenses/RecurringTransactionsSection";
import TransactionFormModal from "@/components/expenses/TransactionFormModal";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { useExpensesPage } from "@/hooks/useExpensesPage";
import { useFormat } from "@/hooks/useFormat";
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions";
import { ADD_EXPENSE_QUERY } from "@/lib/expenses/navigation";

function ExpensesPageContent() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formatCurrency } = useFormat();
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showRecurringPanel, setShowRecurringPanel] = useState(false);
  const wasSubmittingRef = useRef(false);
  const openedFromQueryRef = useRef(false);

  const {
    loading,
    monthSummary,
    categories,
    wallets,
    transactions,
    allTransactionsCount,
    filters,
    setFilters,
    monthStart,
    monthEnd,
    filteredSummary,
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
    handleDelete,
    handleImportTransactions,
    openEditTransaction,
    closeTransactionModal,
    editingTransactionId,
    ingestTransaction,
    ingestCategory,
  } = useExpensesPage();

  const recurring = useRecurringTransactions({
    wallets,
    categories,
    defaultWalletId: walletId,
    onTransactionCreated: ingestTransaction,
  });

  useEffect(() => {
    if (openedFromQueryRef.current || loading || recurring.loading) {
      return;
    }

    if (searchParams.get(ADD_EXPENSE_QUERY) === "1") {
      openedFromQueryRef.current = true;
      setShowTransactionModal(true);
      router.replace("/expenses", { scroll: false });
    }
  }, [loading, recurring.loading, router, searchParams]);

  useEffect(() => {
    if (wasSubmittingRef.current && !submitting && message && !error && showTransactionModal) {
      setShowTransactionModal(false);
      closeTransactionModal();
    }

    wasSubmittingRef.current = submitting;
  }, [submitting, message, error, showTransactionModal, closeTransactionModal]);

  if (loading || recurring.loading) {
    return <p className="text-sm text-slate-500">{t("expenses.loading")}</p>;
  }

  const summaryLine =
    filteredSummary.totalExpenses + filteredSummary.totalIncome > 0
      ? t("expenses.summaryLine", {
          expenses: formatCurrency(filteredSummary.totalExpenses, currency),
          income: formatCurrency(filteredSummary.totalIncome, currency),
        })
      : "";

  return (
    <div className="space-y-6">
      <ExpensesSummaryCard
        totalExpenses={monthSummary.totalExpenses}
        totalIncome={monthSummary.totalIncome}
        balance={monthSummary.balance}
        currency={currency}
      />

      <FeedbackBanner
        error={error ?? recurring.error}
        message={message ?? recurring.message}
      />

      <ExpensesTransactionLog
        transactions={transactions}
        allTransactionsCount={allTransactionsCount}
        summaryLine={summaryLine}
        wallets={wallets}
        categories={categories}
        currency={currency}
        submitting={submitting}
        filters={filters}
        monthStart={monthStart}
        monthEnd={monthEnd}
        attachmentUrls={attachmentUrls}
        onFiltersChange={setFilters}
        onAddTransaction={() => {
          closeTransactionModal();
          setShowTransactionModal(true);
        }}
        onAddRecurring={() => setShowRecurringPanel(true)}
        onImport={handleImportTransactions}
        onDelete={handleDelete}
        onEdit={(transaction) => {
          openEditTransaction(transaction);
          setShowTransactionModal(true);
        }}
      />

      <RecurringTransactionsSection
        open={showRecurringPanel}
        recurrings={recurring.recurrings}
        currency={currency}
        actingId={recurring.actingId}
        onRegisterDue={recurring.registerDue}
        onEdit={recurring.openEditModal}
        onToggleActive={recurring.toggleActive}
        onDelete={recurring.deleteRecurring}
        onOpenAdd={recurring.openFormModal}
        onClose={() => setShowRecurringPanel(false)}
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
        onClose={() => {
          setShowTransactionModal(false);
          closeTransactionModal();
        }}
        onCategoryCreated={ingestCategory}
      />

      {recurring.showFormModal ? (
        <RecurringTransactionFormModal
          mode={recurring.editingId ? "edit" : "add"}
          form={recurring.form}
          wallets={wallets}
          categories={categories}
          submitting={recurring.submitting}
          onChange={recurring.setForm}
          onSubmit={recurring.handleSave}
          onClose={recurring.closeFormModal}
        />
      ) : null}
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
