"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { createClient } from "@/lib/supabase/client";
import {
  deleteTransactionAttachments,
  uploadTransactionReceipt,
} from "@/lib/attachments";
import {
  appendTransactionToSnapshot,
  emptyTransactionFilters,
  filterTransactions,
  getSelectedWalletSnapshot,
  loadExpensesPageData,
  removeTransactionFromSnapshot,
  updateTransactionInSnapshot,
} from "@/lib/expenses";
import type { ParsedImportRow } from "@/lib/expenses/import-csv";
import { usePageFeedback } from "@/hooks/usePageFeedback";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useSyncCompleteListener } from "@/hooks/useSyncCompleteListener";
import type { Category, Transaction, TransactionType, Wallet } from "@/lib/types/database";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import {
  buildLocalTransaction,
  enqueueTransactionInsert,
  isBrowserOnline,
  saveExpensesCache,
  type OfflineTransaction,
} from "@/lib/offline";
import { getMonthRange } from "@/lib/utils/format";
import { summarizeTransactions } from "@/lib/utils/summary";

export function useExpensesPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const online = useNetworkStatus();
  const month = useMemo(() => getMonthRange(new Date(), locale), [locale]);
  const { error, message, setError, setMessage, clearFeedback } = usePageFeedback();

  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<OfflineTransaction[]>([]);
  const [balanceTransactions, setBalanceTransactions] = useState<
    Pick<Transaction, "id" | "wallet_id" | "amount" | "type" | "transfer_role">[]
  >([]);
  const [monthTransactions, setMonthTransactions] = useState<OfflineTransaction[]>([]);
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
  const [usingOfflineCache, setUsingOfflineCache] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  const applySnapshot = useCallback(
    (
      snapshot: {
        currency: string;
        categories: Category[];
        wallets: Wallet[];
        transactions: OfflineTransaction[];
        monthTransactions: OfflineTransaction[];
        balanceTransactions: Pick<
          Transaction,
          "id" | "wallet_id" | "amount" | "type" | "transfer_role"
        >[];
      },
      options?: { fromCache?: boolean },
    ) => {
      setCurrency(snapshot.currency);
      setCategories(snapshot.categories);
      setWallets(snapshot.wallets);
      setTransactions(snapshot.transactions);
      setMonthTransactions(snapshot.monthTransactions);
      setBalanceTransactions(snapshot.balanceTransactions);
      setUsingOfflineCache(Boolean(options?.fromCache));

      if (snapshot.categories[0]) {
        setCategoryId(snapshot.categories[0].id);
      }

      const defaultWallet =
        snapshot.wallets.find((wallet) => wallet.is_default) ?? snapshot.wallets[0];

      if (defaultWallet) {
        setWalletId(defaultWallet.id);
      }
    },
    [],
  );

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const result = await loadExpensesPageData(
      supabase,
      user.id,
      month.start,
      month.end,
      { useNetwork: isBrowserOnline() },
    );

    if (result.kind === "offline-missing") {
      setError(result.message);
      setLoading(false);
      return;
    }

    if (result.kind === "offline-cache") {
      applySnapshot(result.snapshot, { fromCache: true });
      setLoading(false);
      return;
    }

    if (result.kind === "error") {
      if (result.fallbackSnapshot) {
        applySnapshot(result.fallbackSnapshot, { fromCache: true });
        setMessage(result.message);
      } else {
        setError(result.message);
      }
      setLoading(false);
      return;
    }

    applySnapshot(result.snapshot, { fromCache: false });
    setAttachmentUrls(result.attachmentUrls);
    setLoading(false);
  }, [applySnapshot, month.end, month.start, setError, setMessage]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useSyncCompleteListener(loadData);

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

  const persistSnapshot = useCallback(
    async (snapshot: {
      transactions: OfflineTransaction[];
      monthTransactions: OfflineTransaction[];
      balanceTransactions: Pick<
        Transaction,
        "id" | "wallet_id" | "amount" | "type" | "transfer_role"
      >[];
    }) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      await saveExpensesCache({
        userId: user.id,
        cachedAt: new Date().toISOString(),
        currency,
        categories,
        wallets,
        transactions: snapshot.transactions,
        monthTransactions: snapshot.monthTransactions,
        balanceTransactions: snapshot.balanceTransactions,
        monthStart: month.start,
        monthEnd: month.end,
      });
    },
    [categories, currency, month.end, month.start, wallets],
  );

  const ingestTransaction = useCallback(
    (savedTransaction: OfflineTransaction) => {
      const nextSnapshot = appendTransactionToSnapshot(
        {
          currency,
          categories,
          wallets,
          transactions,
          monthTransactions,
          balanceTransactions,
        },
        savedTransaction,
        month.start,
        month.end,
      );

      setTransactions(nextSnapshot.transactions);
      setMonthTransactions(nextSnapshot.monthTransactions);
      setBalanceTransactions(nextSnapshot.balanceTransactions);
      void persistSnapshot(nextSnapshot);
    },
    [
      balanceTransactions,
      categories,
      currency,
      month.end,
      month.start,
      monthTransactions,
      persistSnapshot,
      transactions,
      wallets,
    ],
  );

  function resetTransactionForm() {
    setAmount("");
    setNote("");
    setReceiptFile(null);
    setType("expense");
    setTransactionDate(new Date().toISOString().slice(0, 10));
    setEditingTransactionId(null);

    if (categories[0]) {
      setCategoryId(categories[0].id);
    }

    const defaultWallet = wallets.find((wallet) => wallet.is_default) ?? wallets[0];
    if (defaultWallet) {
      setWalletId(defaultWallet.id);
    }
  }

  function openEditTransaction(transaction: OfflineTransaction) {
    if (transaction.type === "transfer") {
      setError("لا يمكن تعديل عمليات التحويل من هنا.");
      return;
    }

    if (transaction.offlinePending) {
      setError("لا يمكن تعديل عملية محفوظة محلياً قبل مزامنتها.");
      return;
    }

    clearFeedback();
    setEditingTransactionId(transaction.id);
    setAmount(String(transaction.amount));
    setCategoryId(transaction.category_id ?? "");
    setWalletId(transaction.wallet_id ?? "");
    setType(transaction.type === "income" ? "income" : "expense");
    setNote(transaction.note ?? "");
    setTransactionDate(transaction.transaction_date);
    setReceiptFile(null);
  }

  function closeTransactionModal() {
    resetTransactionForm();
  }

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
    const isEditing = Boolean(editingTransactionId);

    try {
      const user = await requireAuthenticatedUser(supabase);
      const payload = {
        wallet_id: walletId,
        category_id: categoryId || null,
        amount: Number(amount),
        type,
        note: note.trim() || null,
        transaction_date: transactionDate,
      };

      if (isEditing) {
        if (!isBrowserOnline()) {
          setError("تعديل العمليات يحتاج اتصالاً بالإنترنت.");
          return;
        }

        const { data, error: updateError } = await supabase
          .from("transactions")
          .update(payload)
          .eq("id", editingTransactionId)
          .select("*, categories(name, icon, color), wallets(name, icon, color)")
          .single();

        if (updateError) {
          throw updateError;
        }

        const updatedTransaction = data as Transaction;

        if (receiptFile) {
          const signedUrl = await uploadTransactionReceipt(
            supabase,
            user.id,
            updatedTransaction.id,
            receiptFile,
          );

          if (signedUrl) {
            setAttachmentUrls((current) => ({
              ...current,
              [updatedTransaction.id]: signedUrl,
            }));
          }
        }

        const nextSnapshot = updateTransactionInSnapshot(
          {
            currency,
            categories,
            wallets,
            transactions,
            monthTransactions,
            balanceTransactions,
          },
          updatedTransaction,
          month.start,
          month.end,
        );

        setTransactions(nextSnapshot.transactions);
        setMonthTransactions(nextSnapshot.monthTransactions);
        setBalanceTransactions(nextSnapshot.balanceTransactions);
        void persistSnapshot(nextSnapshot);
        resetTransactionForm();
        setMessage("تم تحديث العملية بنجاح.");
        router.refresh();
        return;
      }

      if (!isBrowserOnline()) {
        if (receiptFile) {
          setError("رفع المرفقات يحتاج اتصالاً بالإنترنت.");
          return;
        }

        const clientTransactionId = crypto.randomUUID();
        await enqueueTransactionInsert(user.id, clientTransactionId, payload);
        ingestTransaction(
          buildLocalTransaction(
            user.id,
            clientTransactionId,
            payload,
            categories,
            wallets,
          ),
        );
        resetTransactionForm();
        setMessage("تم الحفظ محلياً — سيتم رفع العملية عند عودة الإنترنت.");
        return;
      }

      const { data, error: insertError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          ...payload,
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
      resetTransactionForm();
      setMessage("تم حفظ العملية بنجاح.");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "تعذر حفظ العملية.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleImportTransactions(rows: ParsedImportRow[], importWalletId: string) {
    clearFeedback();

    if (!importWalletId) {
      setError("يجب اختيار محفظة للاستيراد.");
      return;
    }

    if (!isBrowserOnline()) {
      setError("استيراد العمليات يحتاج اتصالاً بالإنترنت.");
      return;
    }

    if (rows.length === 0) {
      setError("لا توجد عمليات صالحة للاستيراد.");
      return;
    }

    setSubmitting(true);

    const supabase = createClient();

    try {
      const user = await requireAuthenticatedUser(supabase);

      const inserts = rows.map((row) => ({
        user_id: user.id,
        wallet_id: importWalletId,
        category_id:
          row.categoryName != null
            ? categories.find(
                (category) =>
                  category.name.trim().toLowerCase() === row.categoryName?.trim().toLowerCase(),
              )?.id ?? null
            : null,
        amount: row.amount,
        type: row.type,
        note: row.note,
        transaction_date: row.transaction_date,
      }));

      const { data, error: insertError } = await supabase
        .from("transactions")
        .insert(inserts)
        .select("*, categories(name, icon, color), wallets(name, icon, color)");

      if (insertError) {
        throw insertError;
      }

      let nextSnapshot = {
        currency,
        categories,
        wallets,
        transactions,
        monthTransactions,
        balanceTransactions,
      };

      for (const savedTransaction of (data ?? []) as Transaction[]) {
        nextSnapshot = appendTransactionToSnapshot(
          nextSnapshot,
          savedTransaction,
          month.start,
          month.end,
        );
      }

      setTransactions(nextSnapshot.transactions);
      setMonthTransactions(nextSnapshot.monthTransactions);
      setBalanceTransactions(nextSnapshot.balanceTransactions);
      void persistSnapshot(nextSnapshot);
      setMessage(`تم استيراد ${(data ?? []).length} عملية بنجاح.`);
      router.refresh();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "تعذر استيراد العمليات.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    clearFeedback();

    const deletedTransaction = transactions.find((transaction) => transaction.id === id);

    if (deletedTransaction?.offlinePending) {
      setError("لا يمكن حذف عملية محفوظة محلياً قبل مزامنتها.");
      return;
    }

    if (!isBrowserOnline()) {
      setError("حذف العمليات يحتاج اتصالاً بالإنترنت.");
      return;
    }

    const supabase = createClient();

    try {
      await deleteTransactionAttachments(supabase, id);

      const { error: deleteError } = await supabase.from("transactions").delete().eq("id", id);

      if (deleteError) {
        throw deleteError;
      }

      const nextSnapshot = removeTransactionFromSnapshot(
        {
          currency,
          categories,
          wallets,
          transactions,
          monthTransactions,
          balanceTransactions,
        },
        id,
      );

      setTransactions(nextSnapshot.transactions);
      setMonthTransactions(nextSnapshot.monthTransactions);
      setBalanceTransactions(nextSnapshot.balanceTransactions);
      setAttachmentUrls((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });

      setMessage("تم حذف العملية.");
      router.refresh();
    } catch (deleteFailure) {
      setError(deleteFailure instanceof Error ? deleteFailure.message : "تعذر حذف العملية.");
    }
  }

  const ingestCategory = useCallback((category: Category) => {
    setCategories((current) => [...current, category]);
    setCategoryId(category.id);
  }, []);

  return {
    loading,
    online,
    usingOfflineCache,
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
    handleImportTransactions,
    openEditTransaction,
    closeTransactionModal,
    editingTransactionId,
    ingestTransaction,
    ingestCategory,
  };
}
