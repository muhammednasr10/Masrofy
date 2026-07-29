import type { OfflineTransaction } from "@/lib/offline/types";
import type { Wallet } from "@/lib/types/database";
import { getTransactionWalletDisplay } from "@/lib/expenses/display";

export type TransactionCsvLabels = {
  date: string;
  type: string;
  category: string;
  wallet: string;
  note: string;
  amount: string;
  currency: string;
  typeExpense: string;
  typeIncome: string;
  noCategory: string;
  noWallet: string;
};

function escapeCsvCell(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function getWalletCsvLabel(wallets: Wallet[], transaction: OfflineTransaction, labels: TransactionCsvLabels) {
  const walletDisplay = getTransactionWalletDisplay(wallets, transaction.wallet_id);

  if (!walletDisplay) {
    return transaction.wallets?.name ?? labels.noWallet;
  }

  const parts = [walletDisplay.wallet.name];

  if (walletDisplay.parent) {
    parts.push(walletDisplay.parent.name);
  }

  if (walletDisplay.typeLabel) {
    parts.push(walletDisplay.typeLabel);
  }

  return parts.join(" / ");
}

export function buildTransactionsCsv(
  transactions: OfflineTransaction[],
  wallets: Wallet[],
  currency: string,
  labels: TransactionCsvLabels,
) {
  const header = [
    labels.date,
    labels.type,
    labels.category,
    labels.wallet,
    labels.note,
    labels.amount,
    labels.currency,
  ];

  const rows = transactions.map((transaction) => {
    const typeLabel =
      transaction.type === "expense" ? labels.typeExpense : labels.typeIncome;
    const categoryLabel =
      transaction.categories?.name ??
      (transaction.type === "income" ? labels.typeIncome : labels.noCategory);

    return [
      transaction.transaction_date,
      typeLabel,
      categoryLabel,
      getWalletCsvLabel(wallets, transaction, labels),
      transaction.note ?? "",
      String(Number(transaction.amount)),
      currency,
    ].map(escapeCsvCell);
  });

  return `\uFEFF${[header.join(","), ...rows.map((row) => row.join(","))].join("\n")}`;
}

export function downloadTransactionsCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
