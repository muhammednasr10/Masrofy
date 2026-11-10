"use client";

import { useState } from "react";
import ExpensesToolbar from "@/components/expenses/ExpensesToolbar";
import MonthDailySummaryModal from "@/components/expenses/MonthDailySummaryModal";
import TransactionsTable from "@/components/expenses/TransactionsTable";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { TransactionFilters } from "@/lib/expenses/filters";
import type { OfflineTransaction } from "@/lib/offline/types";
import type { Category, Wallet } from "@/lib/types/database";

export default function ExpensesTransactionLog({
  transactions,
  monthTransactions,
  wallets,
  categories,
  currency,
  filters,
  monthStart,
  monthEnd,
  attachmentUrls,
  onFiltersChange,
  onAddTransaction,
  onDelete,
  onEdit,
}: {
  transactions: OfflineTransaction[];
  monthTransactions: OfflineTransaction[];
  wallets: Wallet[];
  categories: Category[];
  currency: string;
  filters: TransactionFilters;
  monthStart: string;
  monthEnd: string;
  attachmentUrls: Record<string, string>;
  onFiltersChange: (filters: TransactionFilters) => void;
  onAddTransaction: () => void;
  onDelete: (ids: string[]) => void;
  onEdit: (transaction: OfflineTransaction) => void;
}) {
  const t = useTranslations();
  const [showDailySummary, setShowDailySummary] = useState(false);

  return (
    <section className="rounded-3xl border border-white bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">{t("expenses.transactionLog")}</h2>

        <ExpensesToolbar
          transactions={transactions}
          wallets={wallets}
          categories={categories}
          currency={currency}
          onAddTransaction={onAddTransaction}
          onOpenDailySummary={() => setShowDailySummary(true)}
        />
      </div>

      <TransactionsTable
        transactions={transactions}
        wallets={wallets}
        categories={categories}
        currency={currency}
        filters={filters}
        defaultDateFrom={monthStart}
        defaultDateTo={monthEnd}
        attachmentUrls={attachmentUrls}
        onFiltersChange={onFiltersChange}
        onDelete={onDelete}
        onEdit={onEdit}
      />

      {showDailySummary ? (
        <MonthDailySummaryModal
          transactions={monthTransactions}
          monthStart={monthStart}
          monthEnd={monthEnd}
          currency={currency}
          onClose={() => setShowDailySummary(false)}
        />
      ) : null}
    </section>
  );
}
