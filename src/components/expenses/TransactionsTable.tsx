"use client";

import { useMemo } from "react";
import CategorySearchSelect from "@/components/categories/CategorySearchSelect";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import IconActionButton from "@/components/ui/IconActionButton";
import WalletSelect from "@/components/wallets/WalletSelect";
import { useFormat } from "@/hooks/useFormat";
import { getTransactionWalletDisplay } from "@/lib/expenses/display";
import type { TransactionFilters } from "@/lib/expenses/filters";
import { groupIdenticalTransactions } from "@/lib/expenses/group-transactions";
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
    return `${transaction.wallets?.icon ?? ""} ${transaction.wallets?.name ?? noWalletLabel}`.trim();
  }

  return `${walletDisplay.wallet.icon} ${walletDisplay.wallet.name}`;
}

function MetaIcon({
  icon,
  label,
  active,
  detail,
  href,
}: {
  icon: string;
  label: string;
  active: boolean;
  detail?: string | null;
  href?: string;
}) {
  const title = active && detail ? detail : label;
  const className = `relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs transition sm:h-8 sm:w-8 sm:text-sm ${
    active
      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      : "bg-slate-50 text-slate-300"
  }`;
  const badge = active ? (
    <span
      className="absolute end-0 top-0 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white"
      aria-hidden
    />
  ) : null;

  if (href && active) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={className}
        aria-label={label}
        title={title}
      >
        <span aria-hidden>{icon}</span>
        {badge}
      </a>
    );
  }

  return (
    <span className={className} aria-label={label} title={title}>
      <span aria-hidden>{icon}</span>
      {badge}
    </span>
  );
}

function TransactionActions({
  canEdit,
  hasNote,
  note,
  hasAttachment,
  attachmentUrl,
  noteLabel,
  attachmentLabel,
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
}: {
  canEdit: boolean;
  hasNote: boolean;
  note: string | null;
  hasAttachment: boolean;
  attachmentUrl?: string;
  noteLabel: string;
  attachmentLabel: string;
  editLabel: string;
  deleteLabel: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="inline-flex flex-nowrap items-center justify-end gap-0.5">
      <MetaIcon icon="📝" label={noteLabel} active={hasNote} detail={note} />
      <MetaIcon
        icon="📎"
        label={attachmentLabel}
        active={hasAttachment}
        href={attachmentUrl}
      />
      {canEdit ? (
        <IconActionButton icon="✏️" label={editLabel} onClick={onEdit} tone="slate" />
      ) : (
        <span className="inline-block h-7 w-7 shrink-0 sm:h-8 sm:w-8" aria-hidden />
      )}
      <IconActionButton icon="🗑️" label={deleteLabel} onClick={onDelete} tone="red" />
    </div>
  );
}

const filterClass =
  "mt-1 w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] font-normal text-slate-700 outline-none focus:border-emerald-500";

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
  onDelete: (ids: string[]) => void;
  onEdit: (transaction: OfflineTransaction) => void;
}) {
  const t = useTranslations();
  const { formatCurrency, formatDate } = useFormat();
  const categoryMessages = {
    typeIncome: t("expenses.typeIncome"),
    typeTransfer: t("wallets.transferTransaction"),
    noCategory: t("expenses.noCategory"),
  };
  const groupedTransactions = useMemo(
    () => groupIdenticalTransactions(transactions),
    [transactions],
  );

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
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={filters.search}
          onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
          placeholder={t("expenses.searchPlaceholder")}
          aria-label={t("expenses.searchLabel")}
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500"
        />
        <button
          type="button"
          onClick={resetFilters}
          className="shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 sm:text-sm"
        >
          {t("expenses.filtersReset")}
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full table-fixed border-collapse text-[11px] sm:text-xs md:text-sm">
          <colgroup>
            <col className="w-[15%]" />
            <col className="w-[22%]" />
            <col className="w-[11%]" />
            <col className="w-[18%]" />
            <col className="w-[14%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-1 py-2 text-start align-top font-medium sm:px-1.5">
                {t("expenses.tableDate")}
                <div className="mt-1 space-y-1">
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
              <th className="px-1 py-2 text-start align-top font-medium sm:px-1.5">
                {t("expenses.tableCategory")}
                <CategorySearchSelect
                  categories={categories}
                  value={filters.categoryId}
                  onChange={(categoryId) => onFiltersChange({ ...filters, categoryId })}
                  allowEmpty
                  emptyLabel={t("expenses.allCategories")}
                  className={filterClass}
                />
              </th>
              <th className="px-1 py-2 text-start align-top font-medium sm:px-1.5">
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
              <th className="px-1 py-2 text-start align-top font-medium sm:px-1.5">
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
              <th className="px-1 py-2 text-start align-top font-medium sm:px-1.5">
                {t("expenses.tableAmount")}
              </th>
              <th className="px-1 py-2 text-start align-top font-medium sm:px-1.5">
                {t("expenses.tableAction")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {groupedTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-sm text-slate-500">
                  {t("expenses.noResults")}
                </td>
              </tr>
            ) : (
              groupedTransactions.map((transaction) => {
                const walletLabel = getWalletLabel(wallets, transaction, t("expenses.noWallet"));
                const { mainLabel, subLabel } = getTransactionCategoryColumns(
                  transaction,
                  categories,
                  categoryMessages,
                );
                const canEdit =
                  transaction.groupCount === 1 &&
                  transaction.type !== "transfer" &&
                  !transaction.offlinePending;
                const note = transaction.note?.trim() || "";
                const hasNote = note.length > 0;
                const attachmentUrl = transaction.groupIds
                  .map((id) => attachmentUrls[id])
                  .find(Boolean);
                const hasAttachment = Boolean(attachmentUrl);

                return (
                  <tr key={transaction.groupIds.join("-")} className="hover:bg-slate-50/80">
                    <td className="truncate px-1 py-1.5 text-slate-700 sm:px-1.5">
                      {formatDate(transaction.transaction_date)}
                    </td>
                    <td className="px-1 py-1.5 text-slate-900 sm:px-1.5">
                      <span className="block truncate">{mainLabel}</span>
                      {subLabel && subLabel !== "—" ? (
                        <span className="mt-0.5 block truncate text-[10px] text-slate-500 sm:text-[11px]">
                          {subLabel}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-1 py-1.5 sm:px-1.5">
                      <span
                        className={`inline-flex max-w-full truncate rounded-full px-1.5 py-0.5 text-[10px] font-medium sm:text-[11px] ${
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
                        <span className="mt-1 block truncate rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                          {t("expenses.offlinePending")}
                        </span>
                      ) : null}
                    </td>
                    <td
                      className="truncate px-1 py-1.5 text-slate-600 sm:px-1.5"
                      title={walletLabel}
                    >
                      {walletLabel}
                    </td>
                    <td
                      className={`truncate px-1 py-1.5 font-semibold sm:px-1.5 ${
                        transaction.type === "expense" ? "text-red-600" : "text-emerald-600"
                      }`}
                      title={
                        transaction.groupCount > 1
                          ? t("expenses.groupedCount", { count: transaction.groupCount })
                          : undefined
                      }
                    >
                      {transaction.type === "expense" ? "-" : "+"}
                      {formatCurrency(Number(transaction.amount), currency)}
                      {transaction.groupCount > 1 ? (
                        <span className="ms-1 text-[10px] font-medium text-slate-400">
                          ×{transaction.groupCount}
                        </span>
                      ) : null}
                    </td>
                    <td className="w-[1%] whitespace-nowrap px-0.5 py-1 sm:px-1">
                      <TransactionActions
                        canEdit={canEdit}
                        hasNote={hasNote}
                        note={note || null}
                        hasAttachment={hasAttachment}
                        attachmentUrl={attachmentUrl}
                        noteLabel={hasNote ? t("expenses.tableNote") : t("expenses.noNote")}
                        attachmentLabel={
                          hasAttachment
                            ? t("expenses.viewAttachment")
                            : t("expenses.noAttachment")
                        }
                        editLabel={t("common.edit")}
                        deleteLabel={t("common.delete")}
                        onEdit={() => onEdit(transaction)}
                        onDelete={() => onDelete(transaction.groupIds)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
