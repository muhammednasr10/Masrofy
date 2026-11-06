import type { FormEvent } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  appendTransactionToSnapshot,
  removeTransactionFromSnapshot,
  updateTransactionInSnapshot,
} from "@/lib/expenses";
import type { ReadyTransactionDraft } from "@/lib/expenses/batch-draft";
import type { ParsedImportRow } from "@/lib/expenses/import-csv";
import { deleteTransactionAttachments, uploadTransactionReceipt } from "@/lib/attachments";
import { createClient } from "@/lib/supabase/client";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import type { Category, Transaction, TransactionType, Wallet } from "@/lib/types/database";
import {
  buildLocalTransaction,
  enqueueTransactionInsert,
  isBrowserOnline,
  type OfflineTransaction,
} from "@/lib/offline";

type BalanceTransaction = Pick<
  Transaction,
  "id" | "wallet_id" | "amount" | "type" | "transfer_role"
>;

type ExpenseSnapshot = {
  currency: string;
  categories: Category[];
  wallets: Wallet[];
  transactions: OfflineTransaction[];
  monthTransactions: OfflineTransaction[];
  balanceTransactions: BalanceTransaction[];
  monthStart: string;
  monthEnd: string;
};

export type ExpenseTransactionCommandContext = {
  data: ExpenseSnapshot;
  walletId: string;
  categoryId: string;
  amount: string;
  type: TransactionType;
  note: string;
  transactionDate: string;
  receiptFile: File | null;
  editingTransactionId: string | null;
  categories: Category[];
  setSubmitting: Dispatch<SetStateAction<boolean>>;
  clearFeedback: () => void;
  setError: (message: string | null) => void;
  setMessage: (message: string | null) => void;
  setTransactions: Dispatch<SetStateAction<OfflineTransaction[]>>;
  setMonthTransactions: Dispatch<SetStateAction<OfflineTransaction[]>>;
  setBalanceTransactions: Dispatch<SetStateAction<BalanceTransaction[]>>;
  setAttachmentUrls: Dispatch<SetStateAction<Record<string, string>>>;
  persistSnapshot: (snapshot: {
    transactions: OfflineTransaction[];
    monthTransactions: OfflineTransaction[];
    balanceTransactions: BalanceTransaction[];
  }) => Promise<void>;
  resetTransactionForm: () => void;
  ingestTransaction: (savedTransaction: OfflineTransaction) => void;
  router: { refresh: () => void };
};

function applySnapshot(
  context: ExpenseTransactionCommandContext,
  nextSnapshot: {
    transactions: OfflineTransaction[];
    monthTransactions: OfflineTransaction[];
    balanceTransactions: BalanceTransaction[];
  },
) {
  context.setTransactions(nextSnapshot.transactions);
  context.setMonthTransactions(nextSnapshot.monthTransactions);
  context.setBalanceTransactions(nextSnapshot.balanceTransactions);
  void context.persistSnapshot(nextSnapshot);
}

export async function submitExpenseTransaction(
  event: FormEvent<HTMLFormElement>,
  context: ExpenseTransactionCommandContext,
) {
  event.preventDefault();
  context.setSubmitting(true);
  context.clearFeedback();

  if (!context.walletId) {
    context.setError("يجب اختيار محفظة.");
    context.setSubmitting(false);
    return;
  }

  const supabase = createClient();
  const isEditing = Boolean(context.editingTransactionId);

  try {
    const user = await requireAuthenticatedUser(supabase);
    const payload = {
      wallet_id: context.walletId,
      category_id: context.categoryId || null,
      amount: Number(context.amount),
      type: context.type,
      note: context.note.trim() || null,
      transaction_date: context.transactionDate,
    };

    if (isEditing) {
      if (!isBrowserOnline()) {
        context.setError("تعديل العمليات يحتاج اتصالاً بالإنترنت.");
        return;
      }

      const { data: updatedRow, error: updateError } = await supabase
        .from("transactions")
        .update(payload)
        .eq("id", context.editingTransactionId)
        .select("*, categories(name, icon, color), wallets(name, icon, color)")
        .single();

      if (updateError) {
        throw updateError;
      }

      const updatedTransaction = updatedRow as Transaction;

      if (context.receiptFile) {
        const signedUrl = await uploadTransactionReceipt(
          supabase,
          user.id,
          updatedTransaction.id,
          context.receiptFile,
        );

        if (signedUrl) {
          context.setAttachmentUrls((current) => ({
            ...current,
            [updatedTransaction.id]: signedUrl,
          }));
        }
      }

      applySnapshot(
        context,
        updateTransactionInSnapshot(
          context.data,
          updatedTransaction,
          context.data.monthStart,
          context.data.monthEnd,
        ),
      );
      context.resetTransactionForm();
      context.setMessage("تم تحديث العملية بنجاح.");
      context.router.refresh();
      return;
    }

    if (!isBrowserOnline()) {
      if (context.receiptFile) {
        context.setError("رفع المرفقات يحتاج اتصالاً بالإنترنت.");
        return;
      }

      const clientTransactionId = crypto.randomUUID();
      await enqueueTransactionInsert(user.id, clientTransactionId, payload);
      context.ingestTransaction(
        buildLocalTransaction(
          user.id,
          clientTransactionId,
          payload,
          context.categories,
          context.data.wallets,
        ),
      );
      context.resetTransactionForm();
      context.setMessage("تم الحفظ محلياً — سيتم رفع العملية عند عودة الإنترنت.");
      return;
    }

    const { data: insertedRow, error: insertError } = await supabase
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

    const savedTransaction = insertedRow as Transaction;

    if (context.receiptFile) {
      const signedUrl = await uploadTransactionReceipt(
        supabase,
        user.id,
        savedTransaction.id,
        context.receiptFile,
      );

      if (signedUrl) {
        context.setAttachmentUrls((current) => ({
          ...current,
          [savedTransaction.id]: signedUrl,
        }));
      }
    }

    context.ingestTransaction(savedTransaction);
    context.resetTransactionForm();
    context.setMessage("تم حفظ العملية بنجاح.");
    context.router.refresh();
  } catch (submitError) {
    context.setError(submitError instanceof Error ? submitError.message : "تعذر حفظ العملية.");
  } finally {
    context.setSubmitting(false);
  }
}

export async function saveExpenseLines(
  lines: ReadyTransactionDraft[],
  context: ExpenseTransactionCommandContext,
) {
  context.setSubmitting(true);
  context.clearFeedback();

  if (!context.walletId) {
    context.setError("يجب اختيار محفظة.");
    context.setSubmitting(false);
    return;
  }

  const supabase = createClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const payloads = lines.map((line) => ({
      wallet_id: context.walletId,
      category_id: line.categoryId,
      amount: line.amount,
      type: line.type,
      note: line.note,
      transaction_date: context.transactionDate,
    }));

    if (!isBrowserOnline()) {
      if (context.receiptFile && payloads.length === 1) {
        context.setError("رفع المرفقات يحتاج اتصالاً بالإنترنت.");
        return;
      }

      let offlineSnapshot = context.data;

      for (const payload of payloads) {
        const clientTransactionId = crypto.randomUUID();
        await enqueueTransactionInsert(user.id, clientTransactionId, payload);
        offlineSnapshot = {
          ...offlineSnapshot,
          ...appendTransactionToSnapshot(
            offlineSnapshot,
            buildLocalTransaction(
              user.id,
              clientTransactionId,
              payload,
              context.categories,
              context.data.wallets,
            ),
            context.data.monthStart,
            context.data.monthEnd,
          ),
        };
      }

      applySnapshot(context, offlineSnapshot);
      context.resetTransactionForm();
      context.setMessage(
        payloads.length === 1
          ? "تم الحفظ محلياً — سيتم رفع العملية عند عودة الإنترنت."
          : `تم حفظ ${payloads.length} عمليات محلياً — سيتم رفعها عند عودة الإنترنت.`,
      );
      return;
    }

    const { data: insertedRows, error: insertError } = await supabase
      .from("transactions")
      .insert(payloads.map((payload) => ({ user_id: user.id, ...payload })))
      .select("*, categories(name, icon, color), wallets(name, icon, color)");

    if (insertError) {
      throw insertError;
    }

    const savedTransactions = (insertedRows ?? []) as Transaction[];
    let nextSnapshot = context.data;

    for (const savedTransaction of savedTransactions) {
      nextSnapshot = {
        ...nextSnapshot,
        ...appendTransactionToSnapshot(
          nextSnapshot,
          savedTransaction,
          context.data.monthStart,
          context.data.monthEnd,
        ),
      };
    }

    if (context.receiptFile && savedTransactions.length === 1) {
      const signedUrl = await uploadTransactionReceipt(
        supabase,
        user.id,
        savedTransactions[0].id,
        context.receiptFile,
      );

      if (signedUrl) {
        context.setAttachmentUrls((current) => ({
          ...current,
          [savedTransactions[0].id]: signedUrl,
        }));
      }
    }

    applySnapshot(context, nextSnapshot);
    context.resetTransactionForm();
    context.setMessage(
      savedTransactions.length === 1
        ? "تم حفظ العملية بنجاح."
        : `تم حفظ ${savedTransactions.length} عمليات.`,
    );
    context.router.refresh();
  } catch (submitError) {
    context.setError(submitError instanceof Error ? submitError.message : "تعذر حفظ العمليات.");
  } finally {
    context.setSubmitting(false);
  }
}

export async function importExpenseTransactions(
  rows: ParsedImportRow[],
  importWalletId: string,
  context: ExpenseTransactionCommandContext,
) {
  context.clearFeedback();

  if (!importWalletId) {
    context.setError("يجب اختيار محفظة للاستيراد.");
    return;
  }

  if (!isBrowserOnline()) {
    context.setError("استيراد العمليات يحتاج اتصالاً بالإنترنت.");
    return;
  }

  if (rows.length === 0) {
    context.setError("لا توجد عمليات صالحة للاستيراد.");
    return;
  }

  context.setSubmitting(true);
  const supabase = createClient();

  try {
    const user = await requireAuthenticatedUser(supabase);

    const inserts = rows.map((row) => ({
      user_id: user.id,
      wallet_id: importWalletId,
      category_id:
        row.categoryName != null
          ? context.categories.find(
              (category) =>
                category.name.trim().toLowerCase() === row.categoryName?.trim().toLowerCase(),
            )?.id ?? null
          : null,
      amount: row.amount,
      type: row.type,
      note: row.note,
      transaction_date: row.transaction_date,
    }));

    const { data: insertedRows, error: insertError } = await supabase
      .from("transactions")
      .insert(inserts)
      .select("*, categories(name, icon, color), wallets(name, icon, color)");

    if (insertError) {
      throw insertError;
    }

    let nextSnapshot: ExpenseSnapshot = { ...context.data };

    for (const savedTransaction of (insertedRows ?? []) as Transaction[]) {
      nextSnapshot = {
        ...nextSnapshot,
        ...appendTransactionToSnapshot(
          nextSnapshot,
          savedTransaction,
          context.data.monthStart,
          context.data.monthEnd,
        ),
      };
    }

    applySnapshot(context, nextSnapshot);
    context.setMessage(`تم استيراد ${(insertedRows ?? []).length} عملية بنجاح.`);
    context.router.refresh();
  } catch (importError) {
    context.setError(importError instanceof Error ? importError.message : "تعذر استيراد العمليات.");
  } finally {
    context.setSubmitting(false);
  }
}

export async function deleteExpenseTransaction(
  id: string,
  context: ExpenseTransactionCommandContext,
) {
  context.clearFeedback();

  const deletedTransaction = context.data.transactions.find((transaction) => transaction.id === id);

  if (deletedTransaction?.offlinePending) {
    context.setError("لا يمكن حذف عملية محفوظة محلياً قبل مزامنتها.");
    return;
  }

  if (!isBrowserOnline()) {
    context.setError("حذف العمليات يحتاج اتصالاً بالإنترنت.");
    return;
  }

  const supabase = createClient();

  try {
    await deleteTransactionAttachments(supabase, id);

    const { error: deleteError } = await supabase.from("transactions").delete().eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    applySnapshot(context, removeTransactionFromSnapshot(context.data, id));
    context.setAttachmentUrls((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });

    context.setMessage("تم حذف العملية.");
    context.router.refresh();
  } catch (deleteFailure) {
    context.setError(deleteFailure instanceof Error ? deleteFailure.message : "تعذر حذف العملية.");
  }
}
