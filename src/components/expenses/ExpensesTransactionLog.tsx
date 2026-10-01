"use client";

import ExpensesToolbar from "@/components/expenses/ExpensesToolbar";
import TransactionFiltersPanel from "@/components/expenses/TransactionFiltersPanel";
import TransactionsTable from "@/components/expenses/TransactionsTable";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { TransactionFilters } from "@/lib/expenses/filters";
import type { ParsedImportRow } from "@/lib/expenses/import-csv";
import type { OfflineTransaction } from "@/lib/offline/types";
import type { Category, Wallet } from "@/lib/types/database";

export default function ExpensesTransactionLog({
  transactions,
  allTransactionsCount,
  summaryLine,
  wallets,
  categories,
  currency,
  submitting,
  filters,
  monthStart,
  monthEnd,
  attachmentUrls,
  onFiltersChange,
  onAddTransaction,
  onAddRecurring,
  onImport,
  onDelete,
  onEdit,
}: {
  transactions: OfflineTransaction[];
  allTransactionsCount: number;
  summaryLine: string;
  wallets: Wallet[];
  categories: Category[];
  currency: string;
  submitting: boolean;
  filters: TransactionFilters;
  monthStart: string;
  monthEnd: string;
  attachmentUrls: Record<string, string>;
  onFiltersChange: (filters: TransactionFilters) => void;
  onAddTransaction: () => void;
  onAddRecurring: () => void;
  onImport: (rows: ParsedImportRow[], walletId: string) => Promise<void>;
  onDelete: (id: string) => void;
  onEdit: (transaction: OfflineTransaction) => void;
}) {
  const t = useTranslations();

  return (
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

        <ExpensesToolbar
          transactions={transactions}
          wallets={wallets}
          currency={currency}
          submitting={submitting}
          onAddTransaction={onAddTransaction}
          onAddRecurring={onAddRecurring}
          onImport={onImport}
        />
      </div>

      <TransactionFiltersPanel
        filters={filters}
        categories={categories}
        wallets={wallets}
        defaultDateFrom={monthStart}
        defaultDateTo={monthEnd}
        onChange={onFiltersChange}
      />

      <TransactionsTable
        transactions={transactions}
        wallets={wallets}
        currency={currency}
        attachmentUrls={attachmentUrls}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </section>
  );
}
