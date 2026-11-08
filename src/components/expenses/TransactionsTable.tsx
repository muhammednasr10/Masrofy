"use client";

import CategorySearchSelect from "@/components/categories/CategorySearchSelect";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import IconActionButton from "@/components/ui/IconActionButton";
import WalletSelect from "@/components/wallets/WalletSelect";
import { useFormat } from "@/hooks/useFormat";
import { getTransactionWalletDisplay } from "@/lib/expenses/display";
import type { TransactionFilters } from "@/lib/expenses/filters";
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

const filterClass =
  "mt-2 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-normal text-slate-700 outline-none focus:border-emerald-500";

export default function TransactionsTable({
  transactions,
  wallets,
  categories,
  currency,
  filters,
  defaultDateFrom,
  defaultDateTo,
  attachmentUrls,
  onFiltersChange,
  onDelete,
  onEdit,
}: {
  transactions: OfflineTransaction[];
  wallets: Wallet[];
  categories: Category[];
  currency: string;
  filters: TransactionFilters;
  defaultDateFrom: string;
  defaultDateTo: string;
  attachmentUrls: Record<string, string>;
  onFiltersChange: (filters: TransactionFilters) => void;
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

  function resetFilters() {
    onFiltersChange({
      search: "",
      dateFrom: defaultDateFrom,
      dateTo: defaultDateTo,
      categoryId: "",
      walletId: "",
      type: "all",
    });
  }

  return (
    <div className="mt-4 x-scroll rounded-2xl border border-slate-100">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="min-w-[9.5rem] px-3 py-3 text-start align-top font-medium">
              {t("expenses.tableDate")}
              <div className="mt-2 space-y-1.5">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(event) =>
                    onFiltersChange({ ...filters, dateFrom: event.target.value })
                  }
                  aria-label={t("expenses.dateFrom")}
                  className={`${filterClass} mt-0`}
                />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(event) =>
                    onFiltersChange({ ...filters, dateTo: event.target.value })
                  }
                  aria-label={t("expenses.dateTo")}
                  className={`${filterClass} mt-0`}
                />
              </div>
            </th>
            <th className="min-w-[10rem] px-3 py-3 text-start align-top font-medium">
              {t("expenses.tableMainCategory")}
              <CategorySearchSelect
                categories={categories}
                value={filters.categoryId}
                onChange={(categoryId) => onFiltersChange({ ...filters, categoryId })}
                allowEmpty
                emptyLabel={t("expenses.allCategories")}
                className={filterClass}
              />
            </th>
            <th className="min-w-[8rem] px-3 py-3 text-start align-top font-medium">
              {t("expenses.tableCategory")}
            </th>
            <th className="min-w-[7.5rem] px-3 py-3 text-start align-top font-medium">
              {t("expenses.tableType")}
              <select
                value={filters.type}
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    type: event.target.value as TransactionFilters["type"],
                  })
                }
                aria-label={t("expenses.type")}
                className={filterClass}
              >
                <option value="all">{t("expenses.typeAll")}</option>
                <option value="expense">{t("expenses.typeExpense")}</option>
                <option value="income">{t("expenses.typeIncome")}</option>
              </select>
            </th>
            <th className="min-w-[10rem] px-3 py-3 text-start align-top font-medium">
              {t("expenses.tableWallet")}
              <WalletSelect
                wallets={wallets}
                value={filters.walletId}
                onChange={(walletId) => onFiltersChange({ ...filters, walletId })}
                allowEmpty
                emptyLabel={t("expenses.allWallets")}
                className={filterClass}
              />
            </th>
            <th className="min-w-[10rem] px-3 py-3 text-start align-top font-medium">
              {t("expenses.tableNote")}
              <input
                type="search"
                value={filters.search}
                onChange={(event) =>
                  onFiltersChange({ ...filters, search: event.target.value })
                }
                placeholder={t("expenses.searchPlaceholder")}
                aria-label={t("expenses.searchLabel")}
                className={filterClass}
              />
            </th>
            <th className="min-w-[6.5rem] px-3 py-3 text-start align-top font-medium">
              {t("expenses.tableAmount")}
            </th>
            <th className="min-w-[4.5rem] px-3 py-3 text-start align-top font-medium">
              {t("expenses.tableAttachment")}
            </th>
            <th className="min-w-[6rem] px-3 py-3 text-start align-top font-medium">
              {t("expenses.tableAction")}
              <button
                type="button"
                onClick={resetFilters}
                className="mt-2 block w-full rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
              >
                {t("expenses.filtersReset")}
              </button>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">
                {t("expenses.noResults")}
              </td>
            </tr>
          ) : (
            transactions.map((transaction) => {
              const walletLabel = getWalletLabel(wallets, transaction, t("expenses.noWallet"));
              const { mainLabel, subLabel } = getTransactionCategoryColumns(
                transaction,
                categories,
                categoryMessages,
              );
              const canEdit = transaction.type !== "transfer" && !transaction.offlinePending;

              return (
                <tr key={transaction.id} className="hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-3 py-3 text-slate-700">
                    {formatDate(transaction.transaction_date)}
                  </td>
                  <td className="px-3 py-3 text-slate-900">{mainLabel}</td>
                  <td className="px-3 py-3 text-slate-600">{subLabel}</td>
                  <td className="whitespace-nowrap px-3 py-3">
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
                  <td className="min-w-[180px] px-3 py-3 text-slate-600">{walletLabel}</td>
                  <td className="max-w-[200px] px-3 py-3 text-slate-600">
                    {transaction.note || "—"}
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 py-3 font-semibold ${
                      transaction.type === "expense" ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {transaction.type === "expense" ? "-" : "+"}
                    {formatCurrency(Number(transaction.amount), currency)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
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
                  <td className="whitespace-nowrap px-2 py-2">
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
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
