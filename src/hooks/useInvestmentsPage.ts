"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isMissingSupabaseTableError } from "@/lib/supabase/errors";
import {
  buildInvestmentPayload,
  emptyInvestmentForm,
  investmentToForm,
  type InvestmentFormState,
} from "@/components/investments/InvestmentFormFields";
import {
  emptyInvestmentProfitForm,
  type InvestmentProfitFormState,
} from "@/components/investments/InvestmentProfitModal";
import {
  emptyInvestmentValueForm,
  type InvestmentValueFormState,
} from "@/components/investments/InvestmentValueModal";
import type { Investment, InvestmentProfitEntry, InvestmentUpdate } from "@/lib/types/database";
import {
  getVariableInvestmentValue,
  loadInvestmentPageData,
  sortInvestments,
  summarizeInvestments,
  validateInvestmentForm,
  validateInvestmentProfitForm,
} from "@/lib/investments";

export function useInvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [profitEntriesByInvestment, setProfitEntriesByInvestment] = useState<
    Record<string, InvestmentProfitEntry[]>
  >({});
  const [valueUpdatesByInvestment, setValueUpdatesByInvestment] = useState<
    Record<string, InvestmentUpdate[]>
  >({});
  const [currency, setCurrency] = useState("EGP");
  const [addForm, setAddForm] = useState<InvestmentFormState>(emptyInvestmentForm());
  const [editForm, setEditForm] = useState<InvestmentFormState | null>(null);
  const [profitForm, setProfitForm] = useState<InvestmentProfitFormState>(
    emptyInvestmentProfitForm(),
  );
  const [valueForm, setValueForm] = useState<InvestmentValueFormState | null>(null);
  const [editingInvestmentId, setEditingInvestmentId] = useState<string | null>(null);
  const [profitInvestmentId, setProfitInvestmentId] = useState<string | null>(null);
  const [valueInvestmentId, setValueInvestmentId] = useState<string | null>(null);
  const [historyInvestmentId, setHistoryInvestmentId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingProfit, setSavingProfit] = useState(false);
  const [savingValue, setSavingValue] = useState(false);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const data = await loadInvestmentPageData(supabase);

    if (data.error) {
      setError(data.error);
    }

    setCurrency(data.currency);
    setInvestments(data.investments);
    setProfitEntriesByInvestment(data.profitEntriesByInvestment);
    setValueUpdatesByInvestment(data.valueUpdatesByInvestment);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = useMemo(() => summarizeInvestments(investments), [investments]);

  const profitInvestment = useMemo(
    () => investments.find((investment) => investment.id === profitInvestmentId) ?? null,
    [investments, profitInvestmentId],
  );

  const valueInvestment = useMemo(
    () => investments.find((investment) => investment.id === valueInvestmentId) ?? null,
    [investments, valueInvestmentId],
  );

  const historyInvestment = useMemo(
    () => investments.find((investment) => investment.id === historyInvestmentId) ?? null,
    [investments, historyInvestmentId],
  );

  const historyUpdates = useMemo(
    () => (historyInvestmentId ? (valueUpdatesByInvestment[historyInvestmentId] ?? []) : []),
    [historyInvestmentId, valueUpdatesByInvestment],
  );

  const profitEntries = useMemo(
    () => (profitInvestmentId ? (profitEntriesByInvestment[profitInvestmentId] ?? []) : []),
    [profitEntriesByInvestment, profitInvestmentId],
  );

  const clearFeedback = useCallback(() => {
    setError(null);
    setMessage(null);
  }, []);

  function openAddModal() {
    setAddForm(emptyInvestmentForm());
    setShowAddModal(true);
    clearFeedback();
  }

  function closeAddModal() {
    setShowAddModal(false);
    setAddForm(emptyInvestmentForm());
  }

  function openEditModal(investment: Investment) {
    setEditingInvestmentId(investment.id);
    setEditForm(investmentToForm(investment));
    clearFeedback();
  }

  function closeEditModal() {
    setEditingInvestmentId(null);
    setEditForm(null);
  }

  function openProfitModal(investment: Investment) {
    setProfitInvestmentId(investment.id);
    setProfitForm(emptyInvestmentProfitForm());
    clearFeedback();
  }

  function closeProfitModal() {
    setProfitInvestmentId(null);
    setProfitForm(emptyInvestmentProfitForm());
  }

  function openValueModal(investment: Investment) {
    setValueInvestmentId(investment.id);
    setValueForm(emptyInvestmentValueForm(investment));
    clearFeedback();
  }

  function closeValueModal() {
    setValueInvestmentId(null);
    setValueForm(null);
  }

  function openHistoryModal(investment: Investment) {
    clearFeedback();
    setHistoryInvestmentId(investment.id);
  }

  function closeHistoryModal() {
    setHistoryInvestmentId(null);
  }

  async function persistOrder(nextInvestments: Investment[]) {
    const supabase = createClient();
    const updates = nextInvestments.map((investment, index) =>
      supabase
        .from("investments")
        .update({ sort_order: index + 1 })
        .eq("id", investment.id),
    );

    const results = await Promise.all(updates);
    const failed = results.find((result) => result.error);

    if (failed?.error) {
      setError(failed.error.message);
      await loadData();
      return;
    }

    setInvestments(nextInvestments.map((investment, index) => ({ ...investment, sort_order: index + 1 })));
  }

  async function handleAddSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdding(true);
    clearFeedback();

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("يجب تسجيل الدخول أولاً.");
      setAdding(false);
      return;
    }

    const validationError = validateInvestmentForm(addForm);

    if (validationError) {
      setError(validationError);
      setAdding(false);
      return;
    }

    const nextSortOrder =
      investments.length > 0
        ? Math.max(...investments.map((investment) => investment.sort_order)) + 1
        : 1;

    const { data, error: insertError } = await supabase
      .from("investments")
      .insert({
        user_id: user.id,
        ...buildInvestmentPayload(addForm),
        sort_order: nextSortOrder,
      })
      .select("*")
      .single();

    if (insertError) {
      setError(insertError.message);
      setAdding(false);
      return;
    }

    setInvestments((current) => sortInvestments([...current, data as Investment]));
    setMessage("تمت إضافة الاستثمار بنجاح.");
    closeAddModal();
    setAdding(false);
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingInvestmentId || !editForm) {
      return;
    }

    setSavingEdit(true);
    clearFeedback();

    const validationError = validateInvestmentForm(editForm);

    if (validationError) {
      setError(validationError);
      setSavingEdit(false);
      return;
    }

    const supabase = createClient();
    const payload = buildInvestmentPayload(editForm, {
      includeCurrentValue: editForm.isFixedReturn,
    });

    const { data, error: updateError } = await supabase
      .from("investments")
      .update(payload)
      .eq("id", editingInvestmentId)
      .select("*")
      .single();

    if (updateError) {
      setError(updateError.message);
      setSavingEdit(false);
      return;
    }

    setInvestments((current) =>
      sortInvestments(
        current.map((investment) =>
          investment.id === editingInvestmentId ? (data as Investment) : investment,
        ),
      ),
    );
    setMessage("تم تحديث الاستثمار بنجاح.");
    closeEditModal();
    setSavingEdit(false);
  }

  async function handleProfitSubmit() {
    if (!profitInvestmentId || !profitInvestment) {
      return;
    }

    setSavingProfit(true);
    clearFeedback();

    const validationError = validateInvestmentProfitForm(profitForm);

    if (validationError) {
      setError(validationError);
      setSavingProfit(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("يجب تسجيل الدخول أولاً.");
      setSavingProfit(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("investment_profit_entries")
      .insert({
        user_id: user.id,
        investment_id: profitInvestmentId,
        profit_amount: Number(profitForm.profitAmount),
        period_start: profitForm.periodStart.trim() || null,
        period_end: profitForm.periodEnd,
        note: profitForm.note.trim() || null,
      })
      .select("*")
      .single();

    if (insertError) {
      if (isMissingSupabaseTableError(insertError, "investment_profit_entries")) {
        setError("ميزة تسجيل الربح بالفترة تحتاج migration 012. نفّذ supabase/migrations/012_investment_profit_entries.sql في Supabase.");
      } else {
        setError(insertError.message);
      }
      setSavingProfit(false);
      return;
    }

    const nextEntries = [data as InvestmentProfitEntry, ...profitEntries];
    setProfitEntriesByInvestment((current) => ({
      ...current,
      [profitInvestmentId]: nextEntries,
    }));

    const nextValue = getVariableInvestmentValue(profitInvestment, nextEntries);
    const { data: updatedInvestment, error: updateError } = await supabase
      .from("investments")
      .update({ current_value: nextValue })
      .eq("id", profitInvestmentId)
      .select("*")
      .single();

    if (updateError) {
      setError(updateError.message);
      setSavingProfit(false);
      return;
    }

    setInvestments((current) =>
      sortInvestments(
        current.map((investment) =>
          investment.id === profitInvestmentId ? (updatedInvestment as Investment) : investment,
        ),
      ),
    );
    setProfitForm(emptyInvestmentProfitForm());
    setMessage("تم تسجيل الربح/الخسارة بنجاح.");
    setSavingProfit(false);
  }

  async function handleDeleteProfitEntry(entryId: string) {
    if (!profitInvestmentId || !profitInvestment) {
      return;
    }

    clearFeedback();
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("investment_profit_entries")
      .delete()
      .eq("id", entryId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    const nextEntries = profitEntries.filter((entry) => entry.id !== entryId);
    setProfitEntriesByInvestment((current) => ({
      ...current,
      [profitInvestmentId]: nextEntries,
    }));

    const nextValue = getVariableInvestmentValue(profitInvestment, nextEntries);
    const { data: updatedInvestment, error: updateError } = await supabase
      .from("investments")
      .update({ current_value: nextValue })
      .eq("id", profitInvestmentId)
      .select("*")
      .single();

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setInvestments((current) =>
      sortInvestments(
        current.map((investment) =>
          investment.id === profitInvestmentId ? (updatedInvestment as Investment) : investment,
        ),
      ),
    );
    setMessage("تم حذف القيد.");
  }

  async function handleValueSubmit() {
    if (!valueInvestmentId || !valueInvestment || !valueForm) {
      return;
    }

    const nextValue = Number(valueForm.currentValue);

    if (Number.isNaN(nextValue) || nextValue < 0) {
      setError("أدخل قيمة حالية صحيحة.");
      return;
    }

    setSavingValue(true);
    clearFeedback();

    const supabase = createClient();
    const previousValue = Number(valueInvestment.current_value);

    const { data, error: updateError } = await supabase
      .from("investments")
      .update({ current_value: nextValue })
      .eq("id", valueInvestmentId)
      .select("*")
      .single();

    if (updateError) {
      setError(updateError.message);
      setSavingValue(false);
      return;
    }

    if (previousValue !== nextValue) {
      const { data: updateRow } = await supabase.from("investment_updates").insert({
        user_id: valueInvestment.user_id,
        investment_id: valueInvestmentId,
        previous_value: previousValue,
        new_value: nextValue,
        note: valueForm.note.trim() || null,
      }).select("*").single();

      if (updateRow) {
        setValueUpdatesByInvestment((current) => ({
          ...current,
          [valueInvestmentId]: [
            updateRow as InvestmentUpdate,
            ...(current[valueInvestmentId] ?? []),
          ],
        }));
      }
    }

    setInvestments((current) =>
      sortInvestments(
        current.map((investment) =>
          investment.id === valueInvestmentId ? (data as Investment) : investment,
        ),
      ),
    );
    setMessage("تم تحديث القيمة الحالية.");
    closeValueModal();
    setSavingValue(false);
  }

  async function handleMoveInvestment(investmentId: string, direction: "up" | "down") {
    const ordered = sortInvestments(investments);
    const index = ordered.findIndex((investment) => investment.id === investmentId);

    if (index === -1) {
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= ordered.length) {
      return;
    }

    setReorderingId(investmentId);
    const nextInvestments = [...ordered];
    [nextInvestments[index], nextInvestments[targetIndex]] = [
      nextInvestments[targetIndex],
      nextInvestments[index],
    ];

    await persistOrder(nextInvestments);
    setReorderingId(null);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("investments").delete().eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    if (editingInvestmentId === id) {
      closeEditModal();
    }

    if (profitInvestmentId === id) {
      closeProfitModal();
    }

    if (valueInvestmentId === id) {
      closeValueModal();
    }

    const remaining = sortInvestments(investments.filter((investment) => investment.id !== id));
    setInvestments(remaining);
    setProfitEntriesByInvestment((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    await persistOrder(remaining);
    setMessage("تم حذف الاستثمار.");
  }

  return {
    loading,
    currency,
    investments,
    summary,
    addForm,
    editForm,
    profitForm,
    valueForm,
    profitInvestment,
    valueInvestment,
    historyInvestment,
    historyUpdates,
    profitEntries,
    editingInvestmentId,
    profitInvestmentId,
    valueInvestmentId,
    historyInvestmentId,
    showAddModal,
    adding,
    savingEdit,
    savingProfit,
    savingValue,
    reorderingId,
    error,
    message,
    profitEntriesByInvestment,
    valueUpdatesByInvestment,
    setAddForm,
    setEditForm,
    setProfitForm,
    setValueForm,
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
    openProfitModal,
    closeProfitModal,
    openValueModal,
    closeValueModal,
    openHistoryModal,
    closeHistoryModal,
    handleAddSubmit,
    handleEditSubmit,
    handleProfitSubmit,
    handleValueSubmit,
    handleDeleteProfitEntry,
    handleMoveInvestment,
    handleDelete,
  };
}
