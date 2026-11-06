"use client";

import ExpensesToolbar from "@/components/expenses/ExpensesToolbar";
import TransactionFiltersPanel from "@/components/expenses/TransactionFiltersPanel";
import TransactionsTable from "@/components/expenses/TransactionsTable";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { TransactionFilters } from "@/lib/expenses/filters";
import type { OfflineTransaction } from "@/lib/offline/types";
import type { Category, Wallet } from "@/lib/types/database";

export default function ExpensesTransactionLog({
  transactions,
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
  wallets: Wallet[];
  categories: Category[];
  currency: string;
  filters: TransactionFilters;
  monthStart: string;
  monthEnd: string;
  attachmentUrls: Record<string, string>;
  onFiltersChange: (filters: TransactionFilters) => void;
  onAddTransaction: () => void;
  onDelete: (id: string) => void;
  onEdit: (transaction: OfflineTransaction) => void;
}) {
  const t = useTranslations();

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
        categories={categories}
        currency={currency}
        attachmentUrls={attachmentUrls}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </section>
  );
}
