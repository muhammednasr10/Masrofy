"use client";

import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import ModalEntityHeader from "@/components/ui/ModalEntityHeader";
import ModalShell from "@/components/ui/ModalShell";
import TransactionSummaryRow from "@/components/transactions/TransactionSummaryRow";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useFormat } from "@/hooks/useFormat";
import { getCategoryExpenseTransactions } from "@/lib/expenses/category-transactions";
import type { MonthlySummary, Transaction } from "@/lib/types/database";

type CategoryExpensesModalProps = {
  category: MonthlySummary["byCategory"][number];
  transactions: Transaction[];
  currency: string;
  monthLabel: string;
  formatAmount?: (value: number) => string;
  onClose: () => void;
};

export default function CategoryExpensesModal({
  category,
  transactions,
  currency,
  monthLabel,
  formatAmount,
  onClose,
}: CategoryExpensesModalProps) {
  const t = useTranslations();
  const { formatCurrency, formatDate } = useFormat();
  const displayAmount = formatAmount ?? ((value: number) => formatCurrency(value, currency));
  const categoryTransactions = getCategoryExpenseTransactions(transactions, category);

  return (
    <ModalShell onClose={onClose} maxWidthClassName="sm:max-w-lg">
      <ModalEntityHeader
        icon={category.icon}
        color={category.color}
        title={category.name}
        subtitle={monthLabel}
        onClose={onClose}
      />

      <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
        <p className="text-xs font-medium text-slate-500">{t("dashboard.categoryExpensesTotal")}</p>
        <p className="amount-text mt-1 text-slate-900">{displayAmount(category.total)}</p>
        <p className="mt-1 text-xs text-slate-500">
          {t("dashboard.categoryExpensesCount", { count: categoryTransactions.length })}
        </p>
      </div>

      {categoryTransactions.length === 0 ? (
        <EmptyState message={t("dashboard.categoryExpensesEmpty")} />
      ) : (
        <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto">
          {categoryTransactions.map((transaction) => (
            <TransactionSummaryRow
              key={transaction.id}
              date={formatDate(transaction.transaction_date)}
              primaryLabel={transaction.note?.trim() || t("dashboard.categoryExpenseNoNote")}
              metaLabel={
                transaction.wallets?.name
                  ? `${transaction.wallets.icon} ${transaction.wallets.name}`
                  : undefined
              }
              amount={displayAmount(Number(transaction.amount))}
              amountTone="expense"
            />
          ))}
        </ul>
      )}

      <Link
        href="/expenses"
        className="mt-4 inline-flex text-xs font-medium text-emerald-700 transition hover:text-emerald-800"
      >
        {t("dashboard.categoryExpensesViewAll")} ←
      </Link>
    </ModalShell>
  );
}
