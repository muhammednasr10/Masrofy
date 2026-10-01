"use client";

import { FormEvent, useEffect, useState } from "react";
import CategorySearchSelect from "@/components/categories/CategorySearchSelect";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useSelectedMonth } from "@/components/month/SelectedMonthProvider";
import WalletSelect from "@/components/wallets/WalletSelect";
import { useFormat } from "@/hooks/useFormat";
import {
  pickQuickAddDefaults,
  quickExpenseDate,
  readQuickAddMemory,
  saveQuickExpense,
  writeQuickAddMemory,
} from "@/lib/expenses/quick-add";
import { SYNC_COMPLETE_EVENT } from "@/lib/offline/events";
import { createClient } from "@/lib/supabase/client";
import type { Category, Wallet } from "@/lib/types/database";
import { normalizeWallets } from "@/lib/wallets/normalize";

type QuickAddExpenseSheetProps = {
  onClose: () => void;
  onOpenFullForm: () => void;
  initialCategoryId?: string | null;
};

export default function QuickAddExpenseSheet({
  onClose,
  onOpenFullForm,
  initialCategoryId,
}: QuickAddExpenseSheetProps) {
  const t = useTranslations();
  const { formatDate } = useFormat();
  const { month } = useSelectedMonth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const transactionDate = quickExpenseDate(month);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    void (async () => {
      const [{ data: profile }, { data: categoryRows }, { data: walletRows }] = await Promise.all([
        supabase.from("profiles").select("default_wallet_id").maybeSingle(),
        supabase.from("categories").select("*").order("sort_order", { ascending: true }),
        supabase.from("wallets").select("*").order("sort_order", { ascending: true }),
      ]);

      if (cancelled) {
        return;
      }

      const nextCategories = (categoryRows ?? []) as Category[];
      const nextWallets = normalizeWallets((walletRows ?? []) as Wallet[]);
      const remembered = pickQuickAddDefaults({
        categories: nextCategories,
        wallets: nextWallets,
        defaultWalletId: profile?.default_wallet_id,
        memory: readQuickAddMemory(window.localStorage),
      });
      const presetCategory = nextCategories.find((category) => category.id === initialCategoryId);

      setCategories(nextCategories);
      setWallets(nextWallets);
      setCategoryId(presetCategory?.id ?? remembered.categoryId);
      setWalletId(remembered.walletId);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [initialCategoryId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError(t("expenses.quickAddNeedAmount"));
      return;
    }

    if (!walletId) {
      setError(t("expenses.needWallet"));
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const result = await saveQuickExpense(supabase, {
        amount: parsedAmount,
        categoryId,
        walletId,
        transactionDate,
      });

      writeQuickAddMemory(window.localStorage, { categoryId, walletId });
      window.dispatchEvent(new CustomEvent(SYNC_COMPLETE_EVENT));
      setNotice(result.offline ? t("expenses.quickAddSavedOffline") : t("expenses.quickAddSaved"));
      setAmount("");
      window.setTimeout(onClose, 700);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("expenses.quickAddNeedAmount"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-slate-900/25"
        aria-label={t("common.close")}
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="fixed inset-x-3 bottom-28 z-50 space-y-3 rounded-3xl border border-emerald-100 bg-white p-4 shadow-2xl sm:inset-x-auto sm:end-4 sm:w-[22rem]"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">{t("expenses.quickAddTitle")}</h2>
          <button
            type="button"
            onClick={onOpenFullForm}
            className="text-xs font-medium text-emerald-700"
          >
            {t("expenses.quickAddMore")}
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">{t("common.loading")}</p>
        ) : wallets.length === 0 ? (
          <p className="text-sm text-slate-600">{t("expenses.needWallet")}</p>
        ) : (
          <>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">{t("expenses.formAmount")}</span>
              <input
                autoFocus
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                required
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="amount-text w-full rounded-2xl border border-slate-200 px-4 py-3 text-lg outline-none focus:border-emerald-500"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">{t("expenses.formCategory")}</span>
              <CategorySearchSelect
                categories={categories}
                value={categoryId}
                onChange={setCategoryId}
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus-within:border-emerald-500"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">{t("expenses.formWallet")}</span>
              <WalletSelect
                wallets={wallets}
                value={walletId}
                onChange={setWalletId}
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
        )}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}

        <button
          type="submit"
          disabled={loading || submitting || wallets.length === 0}
          className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? t("expenses.quickAddSaving") : t("expenses.quickAddSave")}
        </button>
      </form>
    </>
  );
}
