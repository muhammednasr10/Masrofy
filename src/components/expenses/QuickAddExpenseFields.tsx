"use client";

import CategorySearchSelect from "@/components/categories/CategorySearchSelect";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import WalletSelect from "@/components/wallets/WalletSelect";
import { useFormat } from "@/hooks/useFormat";
import type { Category, Wallet } from "@/lib/types/database";

export default function QuickAddExpenseFields({
  amount,
  autoFocusAmount,
  categoryId,
  walletId,
  categories,
  wallets,
  typedCategoryName,
  transactionDate,
  onAmountChange,
  onCategoryChange,
  onWalletChange,
  onTypedCategoryNameChange,
  onCreateCategory,
}: {
  amount: string;
  autoFocusAmount: boolean;
  categoryId: string;
  walletId: string;
  categories: Category[];
  wallets: Wallet[];
  typedCategoryName: string;
  transactionDate: string;
  onAmountChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onWalletChange: (value: string) => void;
  onTypedCategoryNameChange: (value: string) => void;
  onCreateCategory: (name?: string) => void;
}) {
  const t = useTranslations();
  const { formatDate } = useFormat();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">{t("expenses.formAmount")}</span>
        <input
          autoFocus={autoFocusAmount}
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          required
          value={amount}
          onChange={(event) => onAmountChange(event.target.value)}
          className="amount-text w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        />
      </label>

      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-slate-700">{t("expenses.formCategory")}</span>
          <button
            type="button"
            onClick={() => onCreateCategory(typedCategoryName)}
            className="min-h-11 text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
          >
            {t("expenses.addCategory")}
          </button>
        </div>
        <CategorySearchSelect
          categories={categories}
          value={categoryId}
          onChange={onCategoryChange}
          onQueryChange={onTypedCategoryNameChange}
          onCreateNew={(name) => onCreateCategory(name)}
          required
          listInFlow
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus-within:border-emerald-500"
        />
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">{t("expenses.formWallet")}</span>
        <WalletSelect
          wallets={wallets}
          value={walletId}
          onChange={onWalletChange}
          required
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        />
      </label>

      <p className="text-xs text-slate-500">
        {transactionDate === today
          ? t("expenses.quickAddDateToday", { date: formatDate(transactionDate) })
          : t("expenses.quickAddDateHint", { date: formatDate(transactionDate) })}
      </p>
    </>
  );
}
