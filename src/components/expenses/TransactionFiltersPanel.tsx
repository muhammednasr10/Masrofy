"use client";

import CategorySelect from "@/components/categories/CategorySelect";
import WalletSelect from "@/components/wallets/WalletSelect";
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
    <div className="mt-4 space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-slate-700">
          بحث وفلترة
          {activeCount > 0 ? ` (${activeCount} نشط)` : ""}
        </p>
        <button
          type="button"
          onClick={resetFilters}
          className="text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
        >
          إعادة ضبط
        </button>
      </div>

      <label className="block space-y-2">
        <span className="text-sm text-slate-600">بحث في الملاحظة، الفئة، المحفظة، أو المبلغ</span>
        <input
          type="search"
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="مثال: Netflix، بنك، 500"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm text-slate-600">من تاريخ</span>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(event) => onChange({ ...filters, dateFrom: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-slate-600">إلى تاريخ</span>
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
          <span className="text-sm text-slate-600">النوع</span>
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
            <option value="all">الكل</option>
            <option value="expense">مصروف</option>
            <option value="income">دخل</option>
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-slate-600">الفئة</span>
          <CategorySelect
            categories={categories}
            value={filters.categoryId}
            onChange={(categoryId) => onChange({ ...filters, categoryId })}
            allowEmpty
            emptyLabel="كل الفئات"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="block space-y-2 sm:col-span-2 lg:col-span-1">
          <span className="text-sm text-slate-600">المحفظة</span>
          <WalletSelect
            wallets={wallets}
            value={filters.walletId}
            onChange={(walletId) => onChange({ ...filters, walletId })}
            allowEmpty
            emptyLabel="كل المحافظ"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>
      </div>
    </div>
  );
}
