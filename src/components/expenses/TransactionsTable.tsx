"use client";

import { useTranslations } from "@/components/i18n/LocaleProvider";
import IconActionButton from "@/components/ui/IconActionButton";
import { useFormat } from "@/hooks/useFormat";
import { getTransactionWalletDisplay } from "@/lib/expenses/display";
import { getTransactionCategoryColumns } from "@/lib/expenses/transaction-display";
import type { OfflineTransaction } from "@/lib/offline/types";
import type { Category, Wallet } from "@/lib/types/database";

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

function TransactionActions({
  canEdit,
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
}: {
  canEdit: boolean;
  editLabel: string;
  deleteLabel: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      {canEdit ? (
        <IconActionButton icon="✏️" label={editLabel} onClick={onEdit} tone="slate" />
      ) : (
        <span className="inline-block h-9 w-9" aria-hidden />
      )}
      <IconActionButton icon="🗑️" label={deleteLabel} onClick={onDelete} tone="red" />
    </div>
  );
}

export default function TransactionsTable({
  transactions,
  wallets,
  categories,
  currency,
  attachmentUrls,
  onDelete,
  onEdit,
}: {
  transactions: OfflineTransaction[];
  wallets: Wallet[];
  categories: Category[];
  currency: string;
  attachmentUrls: Record<string, string>;
  onDelete: (id: string) => void;
  onEdit: (transaction: OfflineTransaction) => void;
}) {
  const t = useTranslations();
  const { formatCurrency, formatDate } = useFormat();
  const categoryMessages = {
    typeIncome: t("expenses.typeIncome"),
    typeTransfer: t("wallets.transferTransaction"),
    noCategory: t("expenses.noCategory"),
  };

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
          const { mainLabel, subLabel } = getTransactionCategoryColumns(
            transaction,
            categories,
            categoryMessages,
          );
          const isExpense = transaction.type === "expense";
          const canEdit = transaction.type !== "transfer" && !transaction.offlinePending;

          return (
            <article
              key={transaction.id}
              className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-500">{formatDate(transaction.transaction_date)}</p>
                    <p className="mt-1 wrap-text font-medium text-slate-900">{mainLabel}</p>
                    {subLabel !== "—" ? (
                      <p className="mt-0.5 wrap-text text-sm text-slate-500">{subLabel}</p>
                    ) : null}
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
              </div>

              <div className="flex items-center justify-end gap-1 border-t border-slate-100 bg-slate-50 px-3 py-2">
                <TransactionActions
                  canEdit={canEdit}
                  editLabel={t("common.edit")}
                  deleteLabel={t("common.delete")}
                  onEdit={() => onEdit(transaction)}
                  onDelete={() => onDelete(transaction.id)}
                />
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
              <th className="px-4 py-3 text-start font-medium">{t("expenses.tableMainCategory")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("expenses.tableCategory")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("expenses.tableType")}</th>
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
              const { mainLabel, subLabel } = getTransactionCategoryColumns(
                transaction,
                categories,
                categoryMessages,
              );
              const canEdit = transaction.type !== "transfer" && !transaction.offlinePending;

              return (
                <tr key={transaction.id} className="hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {formatDate(transaction.transaction_date)}
                  </td>
                  <td className="px-4 py-3 text-slate-900">{mainLabel}</td>
                  <td className="px-4 py-3 text-slate-600">{subLabel}</td>
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
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-base text-emerald-700 transition hover:bg-emerald-100"
                        aria-label={t("expenses.viewAttachment")}
                        title={t("expenses.viewAttachment")}
                      >
                        📎
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <TransactionActions
                      canEdit={canEdit}
                      editLabel={t("common.edit")}
                      deleteLabel={t("common.delete")}
                      onEdit={() => onEdit(transaction)}
                      onDelete={() => onDelete(transaction.id)}
                    />
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
