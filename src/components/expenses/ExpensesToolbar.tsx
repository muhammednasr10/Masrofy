"use client";

import PlanDueReminderButton from "@/components/expenses/PlanDueReminderButton";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useFormat } from "@/hooks/useFormat";
import { getTransactionCategoryColumns } from "@/lib/expenses/transaction-display";
import { getTransactionWalletDisplay } from "@/lib/expenses/display";
import { downloadTransactionsExcel, downloadTransactionsPdf } from "@/lib/expenses/export-sheet";
import type { OfflineTransaction } from "@/lib/offline/types";
import type { Category, Wallet } from "@/lib/types/database";

type ExpensesToolbarProps = {
  transactions: OfflineTransaction[];
  wallets: Wallet[];
  categories: Category[];
  currency: string;
  onAddTransaction: () => void;
};

export default function ExpensesToolbar({
  transactions,
  wallets,
  categories,
  currency,
  onAddTransaction,
}: ExpensesToolbarProps) {
  const t = useTranslations();
  const { formatCurrency, formatDate } = useFormat();
  const canExport = transactions.length > 0;

  function buildSheet() {
    const headers = [
      t("expenses.tableDate"),
      t("expenses.tableMainCategory"),
      t("expenses.tableCategory"),
      t("expenses.tableType"),
      t("expenses.tableWallet"),
      t("expenses.tableNote"),
      t("expenses.tableAmount"),
    ];
    const messages = {
      typeIncome: t("expenses.typeIncome"),
      typeTransfer: t("wallets.transferTransaction"),
      noCategory: t("expenses.noCategory"),
    };
    const rows = transactions.map((transaction) => {
      const { mainLabel, subLabel } = getTransactionCategoryColumns(
        transaction,
        categories,
        messages,
      );
      const wallet = getTransactionWalletDisplay(wallets, transaction.wallet_id);
      const typeLabel =
        transaction.type === "expense"
          ? t("expenses.typeExpense")
          : transaction.type === "income"
            ? t("expenses.typeIncome")
            : t("wallets.transferTransaction");

      return [
        formatDate(transaction.transaction_date),
        mainLabel,
        subLabel,
        typeLabel,
        wallet?.wallet.name ?? transaction.wallets?.name ?? t("expenses.noWallet"),
        transaction.note ?? "",
        formatCurrency(Number(transaction.amount), currency),
      ];
    });

    return { headers, rows };
  }

  function handleExcel() {
    if (!canExport) {
      return;
    }

    const { headers, rows } = buildSheet();
    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadTransactionsExcel(headers, rows, `masrofy-transactions-${dateStamp}.xls`);
  }

  function handlePdf() {
    if (!canExport) {
      return;
    }

    const { headers, rows } = buildSheet();
    downloadTransactionsPdf(t("expenses.transactionLog"), headers, rows);
  }

  return (
    <div className="flex items-center gap-1.5">
      <PlanDueReminderButton />
      <button
        type="button"
        onClick={onAddTransaction}
        aria-label={t("expenses.addTransaction")}
        title={t("expenses.addTransaction")}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-xl font-light leading-none text-white transition hover:bg-emerald-700"
      >
        <span aria-hidden>+</span>
      </button>
      <button
        type="button"
        onClick={handleExcel}
        disabled={!canExport}
        aria-label={t("expenses.exportExcel")}
        title={t("expenses.exportExcel")}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-[10px] font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-40"
      >
        XLS
      </button>
      <button
        type="button"
        onClick={handlePdf}
        disabled={!canExport}
        aria-label={t("expenses.exportPdf")}
        title={t("expenses.exportPdf")}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-red-50 text-[10px] font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-40"
      >
        PDF
      </button>
    </div>
  );
}
