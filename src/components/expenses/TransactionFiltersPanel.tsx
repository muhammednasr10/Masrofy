"use client";

import { useState } from "react";
import CategorySelect from "@/components/categories/CategorySelect";
import WalletSelect from "@/components/wallets/WalletSelect";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { Category, Wallet } from "@/lib/types/database";
import {
  countActiveTransactionFilters,
  type TransactionFilters,
} from "@/lib/expenses/filters";

type TransactionFiltersPanelProps = {
  filters: TransactionFilters;
  categories: Category[];
  wallets: Wallet[];
  defaultDateFrom: string;
  defaultDateTo: string;
  onChange: (filters: TransactionFilters) => void;
};

export default function TransactionFiltersPanel({
  filters,
  categories,
  wallets,
  defaultDateFrom,
  defaultDateTo,
  onChange,
}: TransactionFiltersPanelProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const activeCount = countActiveTransactionFilters(filters);

  function resetFilters() {
    onChange({
      search: "",
      dateFrom: defaultDateFrom,
      dateTo: defaultDateTo,
      categoryId: "",
      walletId: "",
      type: "all",
    });
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50">
      <div className="flex items-center justify-between gap-3 p-4">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex flex-1 items-center gap-2 text-start text-sm font-medium text-slate-700 transition hover:text-slate-900"
          aria-expanded={open}
        >
          <span
            className={`inline-block text-xs text-slate-400 transition-transform ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden
          >
            ▼
          </span>
          <span>
            {t("expenses.filtersTitle")}
            {activeCount > 0 ? ` ${t("expenses.filtersActive", { count: activeCount })}` : ""}
          </span>
        </button>

        {open ? (
          <button
            type="button"
            onClick={resetFilters}
            className="shrink-0 text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
          >
            {t("expenses.filtersReset")}
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="space-y-4 border-t border-slate-100 px-4 pb-4 pt-4">
          <label className="block space-y-2">
            <span className="text-sm text-slate-600">{t("expenses.searchLabel")}</span>
            <input
              type="search"
              value={filters.search}
              onChange={(event) => onChange({ ...filters, search: event.target.value })}
              placeholder={t("expenses.searchPlaceholder")}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm text-slate-600">{t("expenses.dateFrom")}</span>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(event) => onChange({ ...filters, dateFrom: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-slate-600">{t("expenses.dateTo")}</span>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(event) => onChange({ ...filters, dateTo: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block space-y-2">
              <span className="text-sm text-slate-600">{t("expenses.type")}</span>
              <select
                value={filters.type}
                onChange={(event) =>
                  onChange({
                    ...filters,
                    type: event.target.value as TransactionFilters["type"],
                  })
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
              >
                <option value="all">{t("expenses.typeAll")}</option>
                <option value="expense">{t("expenses.typeExpense")}</option>
                <option value="income">{t("expenses.typeIncome")}</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-slate-600">{t("expenses.category")}</span>
              <CategorySelect
                categories={categories}
                value={filters.categoryId}
                onChange={(categoryId) => onChange({ ...filters, categoryId })}
                allowEmpty
                emptyLabel={t("expenses.allCategories")}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
              />
            </label>

            <label className="block space-y-2 sm:col-span-2 lg:col-span-1">
              <span className="text-sm text-slate-600">{t("expenses.wallet")}</span>
              <WalletSelect
                wallets={wallets}
                value={filters.walletId}
                onChange={(walletId) => onChange({ ...filters, walletId })}
                allowEmpty
                emptyLabel={t("expenses.allWallets")}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
              />
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}
