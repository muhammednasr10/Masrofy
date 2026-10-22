"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useSelectedMonth } from "@/components/month/SelectedMonthProvider";
import { useCategoryForm } from "@/hooks/useCategoryForm";
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

export function useQuickAddExpense({
  initialCategoryId,
  onClose,
}: {
  initialCategoryId?: string | null;
  onClose: () => void;
}) {
  const t = useTranslations();
  const { month } = useSelectedMonth();
  const sheetRef = useRef<HTMLFormElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [typedCategoryName, setTypedCategoryName] = useState("");
  const [autoFocusAmount, setAutoFocusAmount] = useState(false);
  const categoryForm = useCategoryForm(categories, (category) => {
    setCategories((current) =>
      current.some((item) => item.id === category.id) ? current : [...current, category],
    );
    setCategoryId(category.id);
  });

  const transactionDate = quickExpenseDate(month);

  useEffect(() => {
    setAutoFocusAmount(window.matchMedia("(min-width: 768px)").matches);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const sheet = sheetRef.current;
    const viewport = window.visualViewport;

    function placeAboveKeyboard() {
      if (!sheet) {
        return;
      }

      const desktop = window.matchMedia("(min-width: 768px)").matches;

      if (!viewport || desktop) {
        sheet.style.bottom = "";
        sheet.style.maxHeight = "";
        return;
      }

      const keyboardOffset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      sheet.style.bottom = `${keyboardOffset}px`;
      sheet.style.maxHeight = `${Math.max(240, viewport.height - 12)}px`;
    }

    placeAboveKeyboard();
    viewport?.addEventListener("resize", placeAboveKeyboard);
    viewport?.addEventListener("scroll", placeAboveKeyboard);

    return () => {
      document.body.style.overflow = previousOverflow;
      viewport?.removeEventListener("resize", placeAboveKeyboard);
      viewport?.removeEventListener("scroll", placeAboveKeyboard);
    };
  }, []);

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

  return {
    t,
    sheetRef,
    categories,
    wallets,
    amount,
    setAmount,
    categoryId,
    setCategoryId,
    walletId,
    setWalletId,
    loading,
    submitting,
    error,
    notice,
    typedCategoryName,
    setTypedCategoryName,
    autoFocusAmount,
    categoryForm,
    transactionDate,
    handleSubmit,
  };
}
