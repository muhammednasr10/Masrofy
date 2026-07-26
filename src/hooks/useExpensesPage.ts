"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  deleteTransactionAttachments,
  loadSignedAttachmentUrls,
  uploadTransactionReceipt,
} from "@/lib/attachments";
import {
  emptyTransactionFilters,
  filterTransactions,
  getSelectedWalletSnapshot,
} from "@/lib/expenses";
import { usePageFeedback } from "@/hooks/usePageFeedback";
import type { Category, Transaction, TransactionType, Wallet } from "@/lib/types/database";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import { getMonthRange } from "@/lib/utils/format";
import { summarizeTransactions } from "@/lib/utils/summary";
import { normalizeWallets } from "@/lib/wallets";

export function useExpensesPage() {
  const router = useRouter();
  const month = useMemo(() => getMonthRange(), []);
  const { error, message, setError, setMessage, clearFeedback } = usePageFeedback();

  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balanceTransactions, setBalanceTransactions] = useState<
    Pick<Transaction, "id" | "wallet_id" | "amount" | "type" | "transfer_role">[]
  >([]);
  const [monthTransactions, setMonthTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState(() =>
    emptyTransactionFilters(month.start, month.end),
  );
  const [currency, setCurrency] = useState("EGP");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [note, setNote] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createClient();

    const [
      { data: profile },
      { data: categoryRows },
      { data: walletRows },
      { data: transactionRows },
      { data: monthRows },
      { data: balanceRows },
    ] = await Promise.all([
      supabase.from("profiles").select("currency, default_wallet_id").maybeSingle(),
      supabase.from("categories").select("*").order("sort_order", { ascending: true }),
      supabase.from("wallets").select("*").order("sort_order", { ascending: true }),
      supabase
        .from("transactions")
        .select("*, categories(name, icon, color), wallets(name, icon, color)")
        .order("transaction_date", { ascending: false }),
      supabase
        .from("transactions")
        .select("*, categories(name, icon, color)")
        .gte("transaction_date", month.start)
        .lte("transaction_date", month.end)
        .order("transaction_date", { ascending: false }),
      supabase.from("transactions").select("id, wallet_id, amount, type, transfer_role"),
    ]);

    const expenseTransactions = ((transactionRows ?? []) as Transaction[]).filter(
      (transaction) => transaction.type !== "transfer",
    );
    const nextAttachmentUrls = await loadSignedAttachmentUrls(
      supabase,
      expenseTransactions.map((transaction) => transaction.id),
    );
    const typedWallets = normalizeWallets((walletRows ?? []) as Wallet[]);

    setCurrency(profile?.currency ?? "EGP");
    setCategories((categoryRows ?? []) as Category[]);
    setWallets(typedWallets);
    setTransactions(expenseTransactions);
    setMonthTransactions(
      ((monthRows ?? []) as Transaction[]).filter(
        (transaction) => transaction.type !== "transfer",
      ),
    );
    setBalanceTransactions(
      (balanceRows ?? []) as Pick<
        Transaction,
        "id" | "wallet_id" | "amount" | "type" | "transfer_role"
      >[],
    );
    setAttachmentUrls(nextAttachmentUrls);

    if (categoryRows?.[0]) {
      setCategoryId(categoryRows[0].id);
    }

    const defaultWallet =
      typedWallets.find((wallet) => wallet.id === profile?.default_wallet_id) ??
      typedWallets.find((wallet) => wallet.is_default) ??
      typedWallets[0];

    if (defaultWallet) {
      setWalletId(defaultWallet.id);
    }

    setLoading(false);
  }, [month.end, month.start]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const monthSummary = useMemo(
    () => summarizeTransactions(monthTransactions),
    [monthTransactions],
  );

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, filters),
    [transactions, filters],
  );

  const filteredSummary = useMemo(
    () => summarizeTransactions(filteredTransactions),
    [filteredTransactions],
  );

  const selectedWalletSnapshot = useMemo(
    () =>
      walletId
        ? getSelectedWalletSnapshot(wallets, walletId, balanceTransactions)
        : null,
    [balanceTransactions, walletId, wallets],
  );

  function handleTypeChange(nextType: TransactionType) {
    setType(nextType);

    if (nextType === "income") {
      return;
    }

    if (!categoryId && categories[0]) {
      setCategoryId(categories[0].id);
    }
  }

  const ingestTransaction = useCallback(
    (savedTransaction: Transaction) => {
      setTransactions((current) => [savedTransaction, ...current]);
      setBalanceTransactions((current) => [
        {
          id: savedTransaction.id,
          wallet_id: savedTransaction.wallet_id,
          amount: savedTransaction.amount,
          type: savedTransaction.type,
          transfer_role: savedTransaction.transfer_role,
        },
        ...current,
      ]);

      if (
        savedTransaction.transaction_date >= month.start &&
        savedTransaction.transaction_date <= month.end
      ) {
        setMonthTransactions((current) => [savedTransaction, ...current]);
      }
    },
    [month.end, month.start],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    clearFeedback();

    if (!walletId) {
      setError("يجب اختيار محفظة.");
      setSubmitting(false);
      return;
    }

    const supabase = createClient();

    try {
      const user = await requireAuthenticatedUser(supabase);
      const { data, error: insertError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          wallet_id: walletId,
          category_id: categoryId || null,
          amount: Number(amount),
          type,
          note: note.trim() || null,
          transaction_date: transactionDate,
        })
        .select("*, categories(name, icon, color), wallets(name, icon, color)")
        .single();

      if (insertError) {
        throw insertError;
      }

      const savedTransaction = data as Transaction;

      if (receiptFile) {
        const signedUrl = await uploadTransactionReceipt(
          supabase,
          user.id,
          savedTransaction.id,
          receiptFile,
        );

        if (signedUrl) {
          setAttachmentUrls((current) => ({
            ...current,
            [savedTransaction.id]: signedUrl,
          }));
        }
      }

      ingestTransaction(savedTransaction);
      setAmount("");
      setNote("");
      setReceiptFile(null);
      setMessage("تم حفظ العملية بنجاح.");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "تعذر حفظ العملية.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    clearFeedback();

    const deletedTransaction = transactions.find((transaction) => transaction.id === id);
    const supabase = createClient();

    try {
      await deleteTransactionAttachments(supabase, id);

      const { error: deleteError } = await supabase.from("transactions").delete().eq("id", id);

      if (deleteError) {
        throw deleteError;
      }

      setTransactions((current) => current.filter((item) => item.id !== id));
      setAttachmentUrls((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });

      if (deletedTransaction) {
        setBalanceTransactions((current) =>
          current.filter((transaction) => transaction.id !== id),
        );
        setMonthTransactions((current) =>
          current.filter((transaction) => transaction.id !== id),
        );
      }

      setMessage("تم حذف العملية.");
      router.refresh();
    } catch (deleteFailure) {
      setError(deleteFailure instanceof Error ? deleteFailure.message : "تعذر حذف العملية.");
    }
  }

  return {
    loading,
    monthLabel: month.label,
    monthStart: month.start,
    monthEnd: month.end,
    monthSummary,
    filteredSummary,
    categories,
    wallets,
    transactions: filteredTransactions,
    allTransactionsCount: transactions.length,
    filters,
    setFilters,
    currency,
    amount,
    categoryId,
    walletId,
    type,
    note,
    transactionDate,
    receiptFile,
    attachmentUrls,
    submitting,
    error,
    message,
    selectedWalletSnapshot,
    setAmount,
    setCategoryId,
    setWalletId,
    handleTypeChange,
    setNote,
    setReceiptFile,
    setTransactionDate,
    handleSubmit,
    handleDelete,
    ingestTransaction,
  };
}
