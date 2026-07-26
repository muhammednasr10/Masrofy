"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { usePageFeedback } from "@/hooks/usePageFeedback";
import { createClient } from "@/lib/supabase/client";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import {
  buildSavingsGoalPayload,
  emptySavingsGoalForm,
  savingsGoalToForm,
  type SavingsGoalFormState,
} from "@/lib/savings";
import { summarizeSavingsGoals } from "@/lib/savings/utils";
import type { SavingsGoal } from "@/lib/types/database";

export function useSavingsGoalsPage() {
  const { error, message, setError, setMessage, clearFeedback } = usePageFeedback();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [currency, setCurrency] = useState("EGP");
  const [addForm, setAddForm] = useState<SavingsGoalFormState>(emptySavingsGoalForm());
  const [editForm, setEditForm] = useState<SavingsGoalFormState | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [contributionGoal, setContributionGoal] = useState<SavingsGoal | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const [{ data: profile }, { data: goalRows }] = await Promise.all([
      supabase.from("profiles").select("currency").maybeSingle(),
      supabase
        .from("savings_goals")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
    ]);

    setCurrency(profile?.currency ?? "EGP");
    setGoals((goalRows ?? []) as SavingsGoal[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = useMemo(() => summarizeSavingsGoals(goals), [goals]);

  async function handleAddSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    clearFeedback();

    const supabase = createClient();

    try {
      const user = await requireAuthenticatedUser(supabase);
      const payload = buildSavingsGoalPayload(addForm, user.id);

      if (!payload.name || Number.isNaN(payload.target_amount) || payload.target_amount <= 0) {
        setError("أدخل اسم الهدف ومبلغاً مستهدفاً صحيحاً.");
        return;
      }

      const { data, error: insertError } = await supabase
        .from("savings_goals")
        .insert(payload)
        .select("*")
        .single();

      if (insertError) {
        throw insertError;
      }

      setGoals((current) => [data as SavingsGoal, ...current]);
      setAddForm(emptySavingsGoalForm());
      setShowAddModal(false);
      setMessage("تم إضافة الهدف.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "تعذر إضافة الهدف.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingGoalId || !editForm) {
      return;
    }

    setSubmitting(true);
    clearFeedback();

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("يجب تسجيل الدخول أولاً.");
      setSubmitting(false);
      return;
    }

    const payload = buildSavingsGoalPayload(editForm, user.id);

    const { data, error: updateError } = await supabase
      .from("savings_goals")
      .update(payload)
      .eq("id", editingGoalId)
      .select("*")
      .single();

    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    setGoals((current) =>
      current.map((goal) => (goal.id === editingGoalId ? (data as SavingsGoal) : goal)),
    );
    setEditingGoalId(null);
    setEditForm(null);
    setMessage("تم تحديث الهدف.");
    setSubmitting(false);
  }

  async function handleContribution(amount: number) {
    if (!contributionGoal || Number.isNaN(amount) || amount <= 0) {
      setError("أدخل مبلغاً صحيحاً.");
      return;
    }

    setSubmitting(true);
    clearFeedback();

    const nextAmount = Number(contributionGoal.current_amount) + amount;
    const isCompleted = nextAmount >= Number(contributionGoal.target_amount);
    const supabase = createClient();

    const { data, error: updateError } = await supabase
      .from("savings_goals")
      .update({
        current_amount: nextAmount,
        is_completed: isCompleted,
      })
      .eq("id", contributionGoal.id)
      .select("*")
      .single();

    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    setGoals((current) =>
      current.map((goal) => (goal.id === contributionGoal.id ? (data as SavingsGoal) : goal)),
    );
    setContributionGoal(null);
    setMessage(isCompleted ? "مبروك! اكتمل الهدف." : "تم تسجيل الإيداع.");
    setSubmitting(false);
  }

  async function handleDelete(goalId: string) {
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("savings_goals").delete().eq("id", goalId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setGoals((current) => current.filter((goal) => goal.id !== goalId));
    setMessage("تم حذف الهدف.");
  }

  return {
    loading,
    currency,
    goals,
    summary,
    addForm,
    editForm,
    editingGoalId,
    contributionGoal,
    showAddModal,
    submitting,
    error,
    message,
    setAddForm,
    setEditForm,
    setContributionGoal,
    openAddModal: () => {
      clearFeedback();
      setAddForm(emptySavingsGoalForm());
      setShowAddModal(true);
    },
    closeAddModal: () => setShowAddModal(false),
    openEditModal: (goal: SavingsGoal) => {
      clearFeedback();
      setEditingGoalId(goal.id);
      setEditForm(savingsGoalToForm(goal));
    },
    closeEditModal: () => {
      setEditingGoalId(null);
      setEditForm(null);
    },
    handleAddSubmit,
    handleEditSubmit,
    handleContribution,
    handleDelete,
  };
}
