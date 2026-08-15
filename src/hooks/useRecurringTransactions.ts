"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  buildRecurringPayload,
  buildRecurringUpdatePayload,
  emptyRecurringForm,
  getDueRecurringTransactions,
  registerRecurringDueTransaction,
  recurringToFormState,
  skipRecurringDueTransaction,
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
  const [editingId, setEditingId] = useState<string | null>(null);
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
      setEditingId(null);
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
    setEditingId(null);
    setForm(emptyRecurringForm(defaultWalletId, categories[0]?.id ?? ""));
    setShowFormModal(true);
  }, [defaultWalletId, categories]);

  const openEditModal = useCallback((recurring: RecurringTransaction) => {
    setError(null);
    setMessage(null);
    setEditingId(recurring.id);
    setForm(recurringToFormState(recurring));
    setShowFormModal(true);
  }, []);

  const closeFormModal = useCallback(() => {
    setShowFormModal(false);
  }, []);

  const handleSave = useCallback(
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

      const query = editingId
        ? supabase
            .from("recurring_transactions")
            .update(buildRecurringUpdatePayload(form))
            .eq("id", editingId)
        : supabase.from("recurring_transactions").insert({
            user_id: user.id,
            ...buildRecurringPayload(form),
          });

      const { data, error: saveError } = await query
        .select("*, categories(name, icon, color), wallets(name, icon, color)")
        .single();

      if (saveError) {
        setError(saveError.message);
        setSubmitting(false);
        return;
      }

      const saved = data as RecurringTransaction;

      setRecurrings((current) =>
        (editingId
          ? current.map((item) => (item.id === editingId ? saved : item))
          : [...current, saved]
        ).sort((a, b) => a.next_due_date.localeCompare(b.next_due_date)),
      );
      setMessage(editingId ? "تم حفظ تعديلات العملية المتكررة." : "تمت إضافة العملية المتكررة.");
      closeFormModal();
      setSubmitting(false);
    },
    [form, editingId, closeFormModal],
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

      const result = await registerRecurringDueTransaction(supabase, user.id, recurring);

      if (!result.ok) {
        setError(result.error === "already_registered" ? "تم تسجيل هذه الدفعة مسبقًا." : result.error);
        setActingId(null);
        return;
      }

      setRecurrings((current) =>
        current
          .map((item) =>
            item.id === recurring.id ? result.updatedRecurring : item,
          )
          .sort((a, b) => a.next_due_date.localeCompare(b.next_due_date)),
      );

      if (result.transaction) {
        onTransactionCreated?.(result.transaction);
      }

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
    const result = await skipRecurringDueTransaction(supabase, recurring);

    if (!result.ok) {
      setError(result.error);
      setActingId(null);
      return;
    }

    setRecurrings((current) =>
      current
        .map((item) => (item.id === recurring.id ? result.updatedRecurring : item))
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
    editingId,
    showFormModal,
    form,
    error,
    message,
    setForm,
    openFormModal,
    openEditModal,
    closeFormModal,
    handleSave,
    registerDue,
    skipDue,
    toggleActive,
    deleteRecurring,
    reload: loadRecurrings,
  };
}
