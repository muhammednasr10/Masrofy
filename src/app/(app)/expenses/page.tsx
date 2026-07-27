"use client";

import { useEffect, useRef, useState } from "react";
import ExpensesSummaryCard from "@/components/expenses/ExpensesSummaryCard";
import RecurringDueSection from "@/components/expenses/RecurringDueSection";
import RecurringTransactionFormModal from "@/components/expenses/RecurringTransactionFormModal";
import RecurringTransactionsSection from "@/components/expenses/RecurringTransactionsSection";
import TransactionFiltersPanel from "@/components/expenses/TransactionFiltersPanel";
import TransactionFormModal from "@/components/expenses/TransactionFormModal";
import TransactionsTable from "@/components/expenses/TransactionsTable";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { FeedbackBanner } from "@/components/wallets/FeedbackBanner";
import { useExpensesPage } from "@/hooks/useExpensesPage";
import { useFormat } from "@/hooks/useFormat";
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions";

export default function ExpensesPage() {
  const t = useTranslations();
  const { formatCurrency } = useFormat();
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const wasSubmittingRef = useRef(false);

  const {
    loading,
    monthLabel,
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
    ingestTransaction,
  } = useExpensesPage();

  const recurring = useRecurringTransactions({
    wallets,
    categories,
    defaultWalletId: walletId,
    onTransactionCreated: ingestTransaction,
  });

  useEffect(() => {
    if (wasSubmittingRef.current && !submitting && message && !error && showTransactionModal) {
      setShowTransactionModal(false);
    }

    wasSubmittingRef.current = submitting;
  }, [submitting, message, error, showTransactionModal]);

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
        monthLabel={monthLabel}
        totalExpenses={monthSummary.totalExpenses}
        totalIncome={monthSummary.totalIncome}
        balance={monthSummary.balance}
        currency={currency}
      />

      <FeedbackBanner
        error={error ?? recurring.error}
        message={message ?? recurring.message}
      />

      <RecurringDueSection
        dueRecurrings={recurring.dueRecurrings}
        currency={currency}
        actingId={recurring.actingId}
        onRegister={recurring.registerDue}
        onSkip={recurring.skipDue}
      />

      <section className="rounded-3xl border border-white bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{t("expenses.transactionLog")}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {t("expenses.transactionCount", {
                filtered: transactions.length,
                total: allTransactionsCount,
              })}
              {summaryLine ? ` • ${summaryLine}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowTransactionModal(true)}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              + {t("expenses.addExpense")}
            </button>
            <button
              type="button"
              onClick={recurring.openFormModal}
              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
            >
              + {t("expenses.addRecurring")}
            </button>
          </div>
        </div>

        <TransactionFiltersPanel
          filters={filters}
          categories={categories}
          wallets={wallets}
          defaultDateFrom={monthStart}
          defaultDateTo={monthEnd}
          onChange={setFilters}
        />

        <TransactionsTable
          transactions={transactions}
          wallets={wallets}
          currency={currency}
          attachmentUrls={attachmentUrls}
          onDelete={handleDelete}
        />
      </section>

      <RecurringTransactionsSection
        recurrings={recurring.recurrings}
        currency={currency}
        onToggleActive={recurring.toggleActive}
        onDelete={recurring.deleteRecurring}
      />

      <TransactionFormModal
        open={showTransactionModal}
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
        onClose={() => setShowTransactionModal(false)}
      />

      {recurring.showFormModal ? (
        <RecurringTransactionFormModal
          form={recurring.form}
          wallets={wallets}
          categories={categories}
          submitting={recurring.submitting}
          onChange={recurring.setForm}
          onSubmit={recurring.handleCreate}
          onClose={recurring.closeFormModal}
        />
      ) : null}
    </div>
  );
}
