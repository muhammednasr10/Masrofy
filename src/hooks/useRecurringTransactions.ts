"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  advanceRecurringDueDate,
  buildRecurringPayload,
  emptyRecurringForm,
  getDueRecurringTransactions,
  isRecurringExpired,
  type RecurringFormState,
} from "@/lib/recurring";
import type { Category, RecurringTransaction, Transaction, Wallet } from "@/lib/types/database";

export function useRecurringTransactions({
  wallets,
  categories,
  defaultWalletId,
  onTransactionCreated,
}: {
  wallets: Wallet[];
  categories: Category[];
  defaultWalletId: string;
  onTransactionCreated?: (transaction: Transaction) => void;
}) {
  const [recurrings, setRecurrings] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [form, setForm] = useState<RecurringFormState>(() =>
    emptyRecurringForm(defaultWalletId, categories[0]?.id ?? ""),
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadRecurrings = useCallback(async () => {
    const supabase = createClient();
    const { data, error: loadError } = await supabase
      .from("recurring_transactions")
      .select("*, categories(name, icon, color), wallets(name, icon, color)")
      .order("next_due_date", { ascending: true });

    if (loadError) {
      setError(loadError.message);
      setRecurrings([]);
    } else {
      setRecurrings((data ?? []) as RecurringTransaction[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadRecurrings();
  }, [loadRecurrings]);

  useEffect(() => {
    if (!showFormModal) {
      setForm(emptyRecurringForm(defaultWalletId, categories[0]?.id ?? ""));
    }
  }, [showFormModal, defaultWalletId, categories]);

  const dueRecurrings = useMemo(() => getDueRecurringTransactions(recurrings), [recurrings]);
  const activeRecurrings = useMemo(
    () => recurrings.filter((item) => item.is_active),
    [recurrings],
  );

  const openFormModal = useCallback(() => {
    setError(null);
    setMessage(null);
    setShowFormModal(true);
  }, []);

  const closeFormModal = useCallback(() => {
    setShowFormModal(false);
  }, []);

  const handleCreate = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitting(true);
      setError(null);
      setMessage(null);

      if (!form.walletId) {
        setError("يجب اختيار محفظة.");
        setSubmitting(false);
        return;
      }

      if (form.type === "expense" && !form.categoryId) {
        setError("يجب اختيار فئة للمصروف المتكرر.");
        setSubmitting(false);
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("يجب تسجيل الدخول أولاً.");
        setSubmitting(false);
        return;
      }

      const { data, error: insertError } = await supabase
        .from("recurring_transactions")
        .insert({
          user_id: user.id,
          ...buildRecurringPayload(form),
        })
        .select("*, categories(name, icon, color), wallets(name, icon, color)")
        .single();

      if (insertError) {
        setError(insertError.message);
        setSubmitting(false);
        return;
      }

      setRecurrings((current) =>
        [...current, data as RecurringTransaction].sort((a, b) =>
          a.next_due_date.localeCompare(b.next_due_date),
        ),
      );
      setMessage("تمت إضافة العملية المتكررة.");
      closeFormModal();
      setSubmitting(false);
    },
    [form, closeFormModal],
  );

  const registerDue = useCallback(
    async (recurring: RecurringTransaction) => {
      setActingId(recurring.id);
      setError(null);
      setMessage(null);

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("يجب تسجيل الدخول أولاً.");
        setActingId(null);
        return;
      }

      const { data: existing } = await supabase
        .from("transactions")
        .select("id")
        .eq("recurring_transaction_id", recurring.id)
        .eq("transaction_date", recurring.next_due_date)
        .maybeSingle();

      if (existing) {
        setError("تم تسجيل هذه الدفعة مسبقًا.");
        setActingId(null);
        return;
      }

      const nextDueDate = advanceRecurringDueDate(recurring);
      const shouldDeactivate = isRecurringExpired({ ...recurring, next_due_date: nextDueDate });

      const { data: transaction, error: insertError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          wallet_id: recurring.wallet_id,
          category_id: recurring.category_id,
          recurring_transaction_id: recurring.id,
          amount: recurring.amount,
          type: recurring.type,
          note: recurring.note,
          transaction_date: recurring.next_due_date,
        })
        .select("*, categories(name, icon, color), wallets(name, icon, color)")
        .single();

      if (insertError) {
        setError(insertError.message);
        setActingId(null);
        return;
      }

      const { data: updatedRecurring, error: updateError } = await supabase
        .from("recurring_transactions")
        .update({
          next_due_date: nextDueDate,
          is_active: shouldDeactivate ? false : recurring.is_active,
        })
        .eq("id", recurring.id)
        .select("*, categories(name, icon, color), wallets(name, icon, color)")
        .single();

      if (updateError) {
        setError(updateError.message);
        setActingId(null);
        return;
      }

      setRecurrings((current) =>
        current
          .map((item) => (item.id === recurring.id ? (updatedRecurring as RecurringTransaction) : item))
          .sort((a, b) => a.next_due_date.localeCompare(b.next_due_date)),
      );
      onTransactionCreated?.(transaction as Transaction);
      setMessage(`تم تسجيل «${recurring.title}» بنجاح.`);
      setActingId(null);
    },
    [onTransactionCreated],
  );

  const skipDue = useCallback(async (recurring: RecurringTransaction) => {
    setActingId(recurring.id);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const nextDueDate = advanceRecurringDueDate(recurring);
    const shouldDeactivate = isRecurringExpired({ ...recurring, next_due_date: nextDueDate });

    const { data, error: updateError } = await supabase
      .from("recurring_transactions")
      .update({
        next_due_date: nextDueDate,
        is_active: shouldDeactivate ? false : recurring.is_active,
      })
      .eq("id", recurring.id)
      .select("*, categories(name, icon, color), wallets(name, icon, color)")
      .single();

    if (updateError) {
      setError(updateError.message);
      setActingId(null);
      return;
    }

    setRecurrings((current) =>
      current
        .map((item) => (item.id === recurring.id ? (data as RecurringTransaction) : item))
        .sort((a, b) => a.next_due_date.localeCompare(b.next_due_date)),
    );
    setMessage(`تم تأجيل «${recurring.title}» للموعد التالي.`);
    setActingId(null);
  }, []);

  const toggleActive = useCallback(async (recurring: RecurringTransaction) => {
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { data, error: updateError } = await supabase
      .from("recurring_transactions")
      .update({ is_active: !recurring.is_active })
      .eq("id", recurring.id)
      .select("*, categories(name, icon, color), wallets(name, icon, color)")
      .single();

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setRecurrings((current) =>
      current.map((item) => (item.id === recurring.id ? (data as RecurringTransaction) : item)),
    );
  }, []);

  const deleteRecurring = useCallback(async (id: string) => {
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("recurring_transactions")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setRecurrings((current) => current.filter((item) => item.id !== id));
    setMessage("تم حذف العملية المتكررة.");
  }, []);

  return {
    recurrings,
    dueRecurrings,
    activeRecurrings,
    loading,
    submitting,
    actingId,
    showFormModal,
    form,
    error,
    message,
    setForm,
    openFormModal,
    closeFormModal,
    handleCreate,
    registerDue,
    skipDue,
    toggleActive,
    deleteRecurring,
    reload: loadRecurrings,
  };
}
