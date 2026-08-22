"use client";

import { FormEvent, useCallback, useState, type Dispatch, type SetStateAction } from "react";
import { createClient } from "@/lib/supabase/client";
import { isMissingSupabaseTableError } from "@/lib/supabase/errors";
import {
  buildInvestmentPayload,
  type InvestmentFormState,
} from "@/components/investments/InvestmentFormFields";
import type { InvestmentProfitFormState } from "@/components/investments/InvestmentProfitModal";
import type { InvestmentValueFormState } from "@/components/investments/InvestmentValueModal";
import type { Investment, InvestmentProfitEntry, InvestmentUpdate } from "@/lib/types/database";
import {
  getVariableInvestmentValue,
  sortInvestments,
  validateInvestmentForm,
  validateInvestmentProfitForm,
} from "@/lib/investments";

type InvestmentMutationFeedback = {
  setError: (message: string | null) => void;
  setMessage: (message: string | null) => void;
  clearFeedback: () => void;
};

type UseInvestmentMutationsOptions = InvestmentMutationFeedback & {
  investments: Investment[];
  setInvestments: Dispatch<SetStateAction<Investment[]>>;
  profitEntriesByInvestment: Record<string, InvestmentProfitEntry[]>;
  setProfitEntriesByInvestment: Dispatch<SetStateAction<Record<string, InvestmentProfitEntry[]>>>;
  valueUpdatesByInvestment: Record<string, InvestmentUpdate[]>;
  setValueUpdatesByInvestment: Dispatch<SetStateAction<Record<string, InvestmentUpdate[]>>>;
  addForm: InvestmentFormState;
  editForm: InvestmentFormState | null;
  profitForm: InvestmentProfitFormState;
  valueForm: InvestmentValueFormState | null;
  editingInvestmentId: string | null;
  profitInvestmentId: string | null;
  valueInvestmentId: string | null;
  profitInvestment: Investment | null;
  valueInvestment: Investment | null;
  profitEntries: InvestmentProfitEntry[];
  closeAddModal: () => void;
  closeEditModal: () => void;
  closeProfitModal: () => void;
  closeValueModal: () => void;
  resetProfitForm: () => void;
  loadData: () => Promise<void>;
};

export function useInvestmentMutations({
  investments,
  setInvestments,
  profitEntriesByInvestment,
  setProfitEntriesByInvestment,
  setValueUpdatesByInvestment,
  addForm,
  editForm,
  profitForm,
  valueForm,
  editingInvestmentId,
  profitInvestmentId,
  valueInvestmentId,
  profitInvestment,
  valueInvestment,
  profitEntries,
  closeAddModal,
  closeEditModal,
  closeProfitModal,
  closeValueModal,
  resetProfitForm,
  loadData,
  setError,
  setMessage,
  clearFeedback,
}: UseInvestmentMutationsOptions) {
  const [adding, setAdding] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingProfit, setSavingProfit] = useState(false);
  const [savingValue, setSavingValue] = useState(false);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const persistOrder = useCallback(
    async (nextInvestments: Investment[]) => {
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

      setInvestments(
        nextInvestments.map((investment, index) => ({ ...investment, sort_order: index + 1 })),
      );
    },
    [loadData, setError, setInvestments],
  );

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
        setError(
          "ميزة تسجيل الربح بالفترة تحتاج migration 012. نفّذ supabase/migrations/012_investment_profit_entries.sql في Supabase.",
        );
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
    resetProfitForm();
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
      const { data: updateRow } = await supabase
        .from("investment_updates")
        .insert({
          user_id: valueInvestment.user_id,
          investment_id: valueInvestmentId,
          previous_value: previousValue,
          new_value: nextValue,
          note: valueForm.note.trim() || null,
        })
        .select("*")
        .single();

      if (updateRow) {
        setValueUpdatesByInvestment((current) => ({
          ...current,
          [valueInvestmentId]: [updateRow as InvestmentUpdate, ...(current[valueInvestmentId] ?? [])],
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
    adding,
    savingEdit,
    savingProfit,
    savingValue,
    reorderingId,
    handleAddSubmit,
    handleEditSubmit,
    handleProfitSubmit,
    handleValueSubmit,
    handleDeleteProfitEntry,
    handleMoveInvestment,
    handleDelete,
  };
}
