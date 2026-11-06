"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { debtRemaining, splitDebtPayments, summarizeDebts, type DebtDirection } from "@/lib/debts/balance";
import { deleteDebt, recordDebtPayment, saveDebt } from "@/lib/debts/commands";
import { createClient } from "@/lib/supabase/client";
import type { Category, Debt, DebtPayment, Wallet } from "@/lib/types/database";

export type DebtFormState = {
  name: string;
  direction: DebtDirection;
  principal: string;
  categoryId: string;
  walletId: string;
  openedOn: string;
  notes: string;
};

export type DebtRow = Debt & {
  paid: number;
  scheduled: number;
  remaining: number;
  room: number;
};

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function emptyDebtForm(): DebtFormState {
  return {
    name: "",
    direction: "i_owe",
    principal: "",
    categoryId: "",
    walletId: "",
    openedOn: todayKey(),
    notes: "",
  };
}

export function debtToForm(debt: Debt): DebtFormState {
  return {
    name: debt.name,
    direction: debt.direction,
    principal: String(debt.principal),
    categoryId: debt.category_id ?? "",
    walletId: debt.wallet_id ?? "",
    openedOn: debt.opened_on,
    notes: debt.notes ?? "",
  };
}

export function useDebtsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [currency, setCurrency] = useState("EGP");
  const [debts, setDebts] = useState<Debt[]>([]);
  const [payments, setPayments] = useState<DebtPayment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [form, setForm] = useState<DebtFormState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [paymentDebt, setPaymentDebt] = useState<DebtRow | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: profile }, { data: debtRows, error: debtError }, { data: paymentRows }, { data: categoryRows }, { data: walletRows }] =
      await Promise.all([
        supabase.from("profiles").select("currency").maybeSingle(),
        supabase.from("debts").select("*").order("created_at", { ascending: false }),
        supabase.from("debt_payments").select("*"),
        supabase.from("categories").select("*").order("sort_order", { ascending: true }),
        supabase.from("wallets").select("*").order("sort_order", { ascending: true }),
      ]);

    if (debtError) {
      setError(
        debtError.code === "42P01" || debtError.message.includes("public.debts")
          ? "جدول الديون لسه مش موجود. نفّذ ملف 038_debts.sql في محرر SQL."
          : debtError.message,
      );
    } else {
      setError(null);
      setDebts((debtRows ?? []) as Debt[]);
      setPayments((paymentRows ?? []) as DebtPayment[]);
    }

    if (profile?.currency) {
      setCurrency(profile.currency);
    }

    setCategories((categoryRows ?? []) as Category[]);
    setWallets((walletRows ?? []) as Wallet[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  const rows = useMemo<DebtRow[]>(() => {
    const { settled, scheduled } = splitDebtPayments(payments, todayKey());

    return debts.map((debt) => {
      const paidAmount = settled.get(debt.id) ?? 0;
      const scheduledAmount = scheduled.get(debt.id) ?? 0;
      const principal = Number(debt.principal);

      return {
        ...debt,
        paid: paidAmount,
        scheduled: scheduledAmount,
        remaining: debtRemaining(principal, paidAmount),
        room: debtRemaining(principal, paidAmount + scheduledAmount),
      };
    });
  }, [debts, payments]);

  const summary = useMemo(
    () => summarizeDebts(rows.map((row) => ({ direction: row.direction, principal: Number(row.principal), paid: row.paid }))),
    [rows],
  );

  async function handleSave() {
    if (!form) {
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      await saveDebt(
        createClient(),
        {
          name: form.name,
          direction: form.direction,
          principal: Number(form.principal),
          categoryId: form.categoryId || null,
          walletId: form.walletId || null,
          openedOn: form.openedOn,
          notes: form.notes,
        },
        editingId ?? undefined,
      );
      setForm(null);
      setEditingId(null);
      setMessage(editingId ? "تم تعديل الدين." : "تمت إضافة الدين.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر حفظ الدين.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(debtId: string) {
    if (!window.confirm("حذف الدين؟ الدفعات المسجلة على المحفظة هتفضل موجودة.")) {
      return;
    }

    setError(null);

    try {
      await deleteDebt(createClient(), debtId);
      setMessage("تم حذف الدين.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر حذف الدين.");
    }
  }

  async function handlePayment(amount: string, paidOn: string) {
    if (!paymentDebt) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await recordDebtPayment(createClient(), paymentDebt, { amount: Number(amount), paidOn });
      setPaymentDebt(null);
      setMessage(
        paidOn > todayKey()
          ? "اتسجلت الدفعة لميعادها. الباقي مش هينقص غير لما اليوم ييجي."
          : "اتسجلت الدفعة ونقص الباقي.",
      );
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر تسجيل الدفعة.");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    loading,
    submitting,
    error,
    message,
    currency,
    categories,
    wallets,
    rows,
    summary,
    form,
    editingId,
    paymentDebt,
    setForm,
    setPaymentDebt,
    openCreate: () => {
      setEditingId(null);
      setForm(emptyDebtForm());
    },
    openEdit: (debt: Debt) => {
      setEditingId(debt.id);
      setForm(debtToForm(debt));
    },
    closeForm: () => {
      setForm(null);
      setEditingId(null);
    },
    handleSave,
    handleDelete,
    handlePayment,
  };
}
