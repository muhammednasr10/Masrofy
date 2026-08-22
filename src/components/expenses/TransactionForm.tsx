"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import CategoryFormModal from "@/components/categories/CategoryFormModal";
import WalletSelect from "@/components/wallets/WalletSelect";
import CategorySearchSelect from "@/components/categories/CategorySearchSelect";
import SelectedWalletPanel from "@/components/expenses/SelectedWalletPanel";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { createClient } from "@/lib/supabase/client";
import {
  emptyCategoryForm,
  insertCategory,
  type CategoryFormState,
} from "@/lib/categories";
import type { Category, TransactionType, Wallet } from "@/lib/types/database";
import type { getSelectedWalletSnapshot } from "@/lib/expenses/display";

type WalletSnapshot = ReturnType<typeof getSelectedWalletSnapshot>;

type TransactionFormProps = {
  categories: Category[];
  wallets: Wallet[];
  currency: string;
  amount: string;
  categoryId: string;
  walletId: string;
  type: TransactionType;
  note: string;
  transactionDate: string;
  receiptFile: File | null;
  submitting: boolean;
  selectedWalletSnapshot: WalletSnapshot;
  formId?: string;
  mode?: "add" | "edit";
  showSubmit?: boolean;
  onAmountChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onWalletChange: (value: string) => void;
  onTypeChange: (value: TransactionType) => void;
  onNoteChange: (value: string) => void;
  onReceiptChange: (file: File | null) => void;
  onTransactionDateChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCategoryCreated?: (category: Category) => void;
};

export default function TransactionForm({
  categories,
  wallets,
  currency,
  amount,
  categoryId,
  walletId,
  type,
  note,
  transactionDate,
  receiptFile,
  submitting,
  selectedWalletSnapshot,
  formId = "transaction-form",
  mode = "add",
  showSubmit = true,
  onAmountChange,
  onCategoryChange,
  onWalletChange,
  onTypeChange,
  onNoteChange,
  onReceiptChange,
  onTransactionDateChange,
  onSubmit,
  onCategoryCreated,
}: TransactionFormProps) {
  const t = useTranslations();
  const [categoryForm, setCategoryForm] = useState<CategoryFormState | null>(null);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  function openCategoryForm() {
    setCategoryForm(emptyCategoryForm(null));
    setCategoryError(null);
  }

  function closeCategoryForm() {
    setCategoryForm(null);
    setCategoryError(null);
  }

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!categoryForm) {
      return;
    }

    setCategorySubmitting(true);
    setCategoryError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCategoryError(t("expenses.categoryLoginRequired"));
      setCategorySubmitting(false);
      return;
    }

    const result = await insertCategory(supabase, user.id, categoryForm, categories);

    if (result.error || !result.category) {
      setCategoryError(result.error ?? t("expenses.categorySaveFailed"));
      setCategorySubmitting(false);
      return;
    }

    onCategoryCreated?.(result.category);
    closeCategoryForm();
    setCategorySubmitting(false);
  }

  if (wallets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
        <p>{t("expenses.needWallet")}</p>
        <Link href="/wallets" className="mt-3 inline-block font-medium text-emerald-700">
          {t("expenses.manageWallets")}
        </Link>
      </div>
    );
  }

  return (
    <>
      <form id={formId} onSubmit={onSubmit} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">{t("expenses.formType")}</span>
        <select
          value={type}
          onChange={(event) => onTypeChange(event.target.value as TransactionType)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        >
          <option value="expense">{t("expenses.typeExpense")}</option>
          <option value="income">{t("expenses.typeIncome")}</option>
        </select>
      </label>

      <div className="space-y-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">{t("expenses.formWallet")}</span>
          <WalletSelect
            wallets={wallets}
            value={walletId}
            onChange={onWalletChange}
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>
        <SelectedWalletPanel
          snapshot={selectedWalletSnapshot}
          type={type}
          currency={currency}
        />
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">{t("expenses.formDate")}</span>
        <input
          type="date"
          required
          value={transactionDate}
          onChange={(event) => onTransactionDateChange(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        />
      </label>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-slate-700">
            {type === "income" ? t("expenses.formCategoryOptional") : t("expenses.formCategory")}
          </span>
          <button
            type="button"
            onClick={openCategoryForm}
            className="text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
          >
            {t("expenses.addCategory")}
          </button>
        </div>
        <CategorySearchSelect
          categories={categories}
          value={categoryId}
          onChange={onCategoryChange}
          allowEmpty={type === "income"}
          required={type === "expense"}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus-within:border-emerald-500"
        />
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">{t("expenses.formAmount")}</span>
        <input
          type="number"
          min="0.01"
          step="0.01"
          required
          value={amount}
          onChange={(event) => onAmountChange(event.target.value)}
          className="amount-text w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-emerald-500"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">{t("expenses.formNote")}</span>
        <input
          type="text"
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder={t("expenses.formNoteOptional")}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">{t("expenses.formReceipt")}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          onChange={(event) => onReceiptChange(event.target.files?.[0] ?? null)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none file:me-3 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-700 focus:border-emerald-500"
        />
        {receiptFile ? (
          <span className="block text-xs text-slate-500">{receiptFile.name}</span>
        ) : null}
      </label>

      {showSubmit ? (
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting
            ? t("expenses.formSaving")
            : mode === "edit"
              ? t("expenses.formSaveChanges")
              : t("expenses.formSave")}
        </button>
      ) : null}
      </form>

      {categoryForm ? (
        <CategoryFormModal
          form={categoryForm}
          categories={categories}
          submitting={categorySubmitting}
          error={categoryError}
          onChange={setCategoryForm}
          onSubmit={handleCategorySubmit}
          onClose={closeCategoryForm}
          zIndexClassName="z-[60]"
        />
      ) : null}
    </>
  );
}
