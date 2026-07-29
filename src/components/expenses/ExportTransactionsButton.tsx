"use client";

import { useTranslations } from "@/components/i18n/LocaleProvider";
import { downloadTransactionsCsv, buildTransactionsCsv } from "@/lib/expenses/export-csv";
import type { OfflineTransaction } from "@/lib/offline/types";
import type { Wallet } from "@/lib/types/database";

type ExportTransactionsButtonProps = {
  transactions: OfflineTransaction[];
  wallets: Wallet[];
  currency: string;
  filenamePrefix?: string;
};

export default function ExportTransactionsButton({
  transactions,
  wallets,
  currency,
  filenamePrefix = "masrofy-transactions",
}: ExportTransactionsButtonProps) {
  const t = useTranslations();

  function handleExport() {
    if (transactions.length === 0) {
      return;
    }

    const csv = buildTransactionsCsv(transactions, wallets, currency, {
      date: t("expenses.tableDate"),
      type: t("expenses.tableType"),
      category: t("expenses.tableCategory"),
      wallet: t("expenses.tableWallet"),
      note: t("expenses.tableNote"),
      amount: t("expenses.tableAmount"),
      currency: t("expenses.exportCurrency"),
      typeExpense: t("expenses.typeExpense"),
      typeIncome: t("expenses.typeIncome"),
      noCategory: t("expenses.noCategory"),
      noWallet: t("expenses.noWallet"),
    });

    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadTransactionsCsv(csv, `${filenamePrefix}-${dateStamp}.csv`);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={transactions.length === 0}
      className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
    >
      ⬇ {t("expenses.exportCsv")}
    </button>
  );
}
