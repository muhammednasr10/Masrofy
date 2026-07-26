"use client";

import ExpensesSummaryCard from "@/components/expenses/ExpensesSummaryCard";
import RecurringDueSection from "@/components/expenses/RecurringDueSection";
import RecurringTransactionFormModal from "@/components/expenses/RecurringTransactionFormModal";
import RecurringTransactionsSection from "@/components/expenses/RecurringTransactionsSection";
import TransactionFiltersPanel from "@/components/expenses/TransactionFiltersPanel";
import TransactionForm from "@/components/expenses/TransactionForm";
import TransactionsList from "@/components/expenses/TransactionsList";
import { FeedbackBanner } from "@/components/wallets/FeedbackBanner";
import { useExpensesPage } from "@/hooks/useExpensesPage";
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions";
import { formatCurrency } from "@/lib/utils/format";

export default function ExpensesPage() {
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

  if (loading || recurring.loading) {
    return <p className="text-sm text-slate-500">جاري تحميل المصروفات...</p>;
  }

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

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <section className="rounded-3xl border border-white bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold text-slate-900">إضافة عملية</h2>
          <p className="mt-1 text-sm text-slate-500">
            اختَر المحفظة الرئيسية أو الفرعية. الكريديت يزيد المستحق بالمصروف ويقلّه بالدخل.
          </p>

          <div className="mt-6">
            <TransactionForm
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
            />
          </div>
        </section>

        <section className="rounded-3xl border border-white bg-white p-4 shadow-sm sm:p-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">سجل العمليات</h2>
            <p className="mt-1 text-sm text-slate-500">
              {transactions.length} من {allTransactionsCount} عملية
              {filteredSummary.totalExpenses + filteredSummary.totalIncome > 0
                ? ` • مصروفات ${formatCurrency(filteredSummary.totalExpenses, currency)} • دخل ${formatCurrency(filteredSummary.totalIncome, currency)}`
                : ""}
            </p>
          </div>

          <TransactionFiltersPanel
            filters={filters}
            categories={categories}
            wallets={wallets}
            defaultDateFrom={monthStart}
            defaultDateTo={monthEnd}
            onChange={setFilters}
          />

          <TransactionsList
            transactions={transactions}
            wallets={wallets}
            currency={currency}
            attachmentUrls={attachmentUrls}
            onDelete={handleDelete}
          />
        </section>
      </div>

      <RecurringTransactionsSection
        recurrings={recurring.recurrings}
        currency={currency}
        onToggleActive={recurring.toggleActive}
        onDelete={recurring.deleteRecurring}
        onOpenAdd={recurring.openFormModal}
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
