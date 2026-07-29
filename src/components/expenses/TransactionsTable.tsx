"use client";

import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useFormat } from "@/hooks/useFormat";
import type { OfflineTransaction } from "@/lib/offline/types";
import type { Wallet } from "@/lib/types/database";
import { getTransactionWalletDisplay } from "@/lib/expenses/display";

function getWalletLabel(
  wallets: Wallet[],
  transaction: OfflineTransaction,
  noWalletLabel: string,
) {
  const walletDisplay = getTransactionWalletDisplay(wallets, transaction.wallet_id);

  if (!walletDisplay) {
    return `${transaction.wallets?.icon ?? ""} ${transaction.wallets?.name ?? noWalletLabel}`;
  }

  return `${walletDisplay.wallet.icon} ${walletDisplay.wallet.name}${
    walletDisplay.parent
      ? ` • ${walletDisplay.parent.icon} ${walletDisplay.parent.name}`
      : ""
  }${walletDisplay.typeLabel ? ` • ${walletDisplay.typeLabel}` : ""}`;
}

export default function TransactionsTable({
  transactions,
  wallets,
  currency,
  attachmentUrls,
  onDelete,
}: {
  transactions: OfflineTransaction[];
  wallets: Wallet[];
  currency: string;
  attachmentUrls: Record<string, string>;
  onDelete: (id: string) => void;
}) {
  const t = useTranslations();
  const { formatCurrency, formatDate } = useFormat();

  if (transactions.length === 0) {
    return (
      <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {t("expenses.noResults")}
      </p>
    );
  }

  return (
    <>
      <div className="mt-6 space-y-3 md:hidden">
        {transactions.map((transaction) => {
          const walletLabel = getWalletLabel(wallets, transaction, t("expenses.noWallet"));
          const categoryLabel =
            transaction.categories?.name ??
            (transaction.type === "income" ? t("expenses.typeIncome") : t("expenses.noCategory"));
          const isExpense = transaction.type === "expense";

          return (
            <article
              key={transaction.id}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-500">{formatDate(transaction.transaction_date)}</p>
                  <p className="mt-1 wrap-text font-medium text-slate-900">
                    {transaction.categories?.icon} {categoryLabel}
                  </p>
                </div>
                <p
                  className={`amount-text shrink-0 ${
                    isExpense ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {isExpense ? "-" : "+"}
                  {formatCurrency(Number(transaction.amount), currency)}
                </p>
              </div>

              <div className="mt-3 space-y-2 text-sm leading-6">
                <p className="wrap-text text-slate-600">
                  <span className="font-medium text-slate-700">{t("expenses.tableWallet")}: </span>
                  {walletLabel}
                </p>
                {transaction.note ? (
                  <p className="wrap-text text-slate-600">
                    <span className="font-medium text-slate-700">{t("expenses.tableNote")}: </span>
                    {transaction.note}
                  </p>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    isExpense ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {isExpense ? t("expenses.typeExpense") : t("expenses.typeIncome")}
                </span>
                {transaction.offlinePending ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    {t("expenses.offlinePending")}
                  </span>
                ) : null}
                {attachmentUrls[transaction.id] ? (
                  <a
                    href={attachmentUrls[transaction.id]}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                  >
                    📎 {t("expenses.viewAttachment")}
                  </a>
                ) : null}
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => onDelete(transaction.id)}
                  className="rounded-full px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50"
                >
                  {t("common.delete")}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-6 hidden x-scroll rounded-2xl border border-slate-100 md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t("expenses.tableDate")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("expenses.tableType")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("expenses.tableCategory")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("expenses.tableWallet")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("expenses.tableNote")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("expenses.tableAmount")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("expenses.tableAttachment")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("expenses.tableAction")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {transactions.map((transaction) => {
              const walletLabel = getWalletLabel(wallets, transaction, t("expenses.noWallet"));

              return (
                <tr key={transaction.id} className="hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {formatDate(transaction.transaction_date)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        transaction.type === "expense"
                          ? "bg-red-50 text-red-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {transaction.type === "expense"
                        ? t("expenses.typeExpense")
                        : t("expenses.typeIncome")}
                    </span>
                    {transaction.offlinePending ? (
                      <span className="ms-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        {t("expenses.offlinePending")}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-900">
                    {transaction.categories?.icon}{" "}
                    {transaction.categories?.name ??
                      (transaction.type === "income"
                        ? t("expenses.typeIncome")
                        : t("expenses.noCategory"))}
                  </td>
                  <td className="min-w-[180px] px-4 py-3 text-slate-600">{walletLabel}</td>
                  <td className="max-w-[200px] px-4 py-3 text-slate-600">
                    {transaction.note || "—"}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3 font-semibold ${
                      transaction.type === "expense" ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {transaction.type === "expense" ? "-" : "+"}
                    {formatCurrency(Number(transaction.amount), currency)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {attachmentUrls[transaction.id] ? (
                      <a
                        href={attachmentUrls[transaction.id]}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        📎 {t("expenses.viewAttachment")}
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onDelete(transaction.id)}
                      className="rounded-full px-3 py-1 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                    >
                      {t("common.delete")}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
