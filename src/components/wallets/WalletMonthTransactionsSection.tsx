"use client";

import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import TransactionSummaryRow from "@/components/transactions/TransactionSummaryRow";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useFormat } from "@/hooks/useFormat";
import {
  getTransactionAmountTone,
  getTransactionCategoryLabel,
} from "@/lib/expenses/transaction-display";
import type { Transaction } from "@/lib/types/database";

type WalletMonthTransactionsSectionProps = {
  transactions: Transaction[];
  currency: string;
  hasChildren: boolean;
};

export default function WalletMonthTransactionsSection({
  transactions,
  currency,
  hasChildren,
}: WalletMonthTransactionsSectionProps) {
  const t = useTranslations();
  const { formatCurrency, formatDate } = useFormat();

  if (transactions.length === 0) {
    return <EmptyState message={t("wallets.monthTransactionsEmpty")} className="" />;
  }

  return (
    <>
      <ul className="max-h-64 space-y-2 overflow-y-auto">
        {transactions.map((transaction) => {
          const tone = getTransactionAmountTone(transaction);

          return (
            <TransactionSummaryRow
              key={transaction.id}
              date={formatDate(transaction.transaction_date)}
              iconPrefix={transaction.categories?.icon ?? undefined}
              primaryLabel={getTransactionCategoryLabel(transaction, {
                typeIncome: t("expenses.typeIncome"),
                typeTransfer: t("wallets.transferTransaction"),
                noCategory: t("expenses.noCategory"),
              })}
              secondaryLabel={transaction.note ?? undefined}
              metaLabel={
                hasChildren && transaction.wallets?.name ? transaction.wallets.name : undefined
              }
              amount={formatCurrency(Number(transaction.amount), currency)}
              amountTone={tone}
            />
          );
        })}
      </ul>

      <Link
        href="/expenses"
        className="mt-3 inline-flex text-xs font-medium text-emerald-700 transition hover:text-emerald-800"
      >
        {t("wallets.viewAllExpenses")} ←
      </Link>
    </>
  );
}
