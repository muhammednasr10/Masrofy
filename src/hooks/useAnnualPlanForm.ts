"use client";

import { useState } from "react";
import {
  applyAnnualTemplateToYear,
  categoryPlansFromTemplateItems,
  persistAnnualTemplate,
} from "@/lib/plan";
import { createClient } from "@/lib/supabase/client";
import type {
  AnnualPlanTemplate,
  AnnualPlanTemplateItem,
  Category,
} from "@/lib/types/database";

type AnnualPlanFormOptions = {
  categories: Category[];
  planYear: number;
  monthStartDay: number;
  plannedIncome: string;
  notes: string;
  categoryPlans: Record<string, string>;
  annualTemplate: AnnualPlanTemplate | null;
  annualTemplateItems: AnnualPlanTemplateItem[];
  setAnnualTemplate: (template: AnnualPlanTemplate | null) => void;
  setAnnualTemplateItems: (items: AnnualPlanTemplateItem[]) => void;
  setPlannedIncome: (value: string) => void;
  setNotes: (value: string) => void;
  setCategoryPlans: (plans: Record<string, string>) => void;
  loadData: () => Promise<void>;
  clearFeedback: () => void;
  setMessage: (message: string) => void;
};

export function useAnnualPlanForm({
  categories,
  planYear,
  monthStartDay,
  plannedIncome,
  notes,
  categoryPlans,
  annualTemplate,
  annualTemplateItems,
  setAnnualTemplate,
  setAnnualTemplateItems,
  setPlannedIncome,
  setNotes,
  setCategoryPlans,
  loadData,
  clearFeedback,
  setMessage,
}: AnnualPlanFormOptions) {
  const [annualModalOpen, setAnnualModalOpen] = useState(false);
  const [annualPlannedIncome, setAnnualPlannedIncome] = useState("");
  const [annualCategoryPlans, setAnnualCategoryPlans] = useState<Record<string, string>>({});
  const [annualNotes, setAnnualNotes] = useState("");
  const [annualSaving, setAnnualSaving] = useState(false);
  const [annualApplying, setAnnualApplying] = useState(false);
  const [annualError, setAnnualError] = useState<string | null>(null);

  function addAnnualCategory(categoryId: string) {
    setAnnualCategoryPlans((current) => ({
      ...current,
      [categoryId]: current[categoryId] ?? "",
    }));
  }

  function handleAnnualCategoryPlanChange(categoryId: string, value: string) {
    setAnnualCategoryPlans((current) => ({
      ...current,
      [categoryId]: value,
    }));
  }

  function openAnnualModal() {
    if (annualTemplate) {
      setAnnualPlannedIncome(String(annualTemplate.planned_income));
      setAnnualNotes(annualTemplate.notes ?? "");
      setAnnualCategoryPlans(categoryPlansFromTemplateItems(categories, annualTemplateItems));
    } else {
      setAnnualPlannedIncome(plannedIncome);
      setAnnualNotes(notes);
      setAnnualCategoryPlans({ ...categoryPlans });
    }

    setAnnualError(null);
    setAnnualModalOpen(true);
  }

  function closeAnnualModal() {
    setAnnualModalOpen(false);
    setAnnualError(null);
  }

  async function saveAnnualTemplate() {
    const supabase = createClient();
    const result = await persistAnnualTemplate(
      supabase,
      categories,
      planYear,
      annualPlannedIncome,
      annualNotes,
      annualCategoryPlans,
    );

    setAnnualTemplate(result.template);
    setAnnualTemplateItems(result.items);
    return result.template;
  }

  async function handleSaveAnnualTemplate() {
    setAnnualSaving(true);
    setAnnualError(null);
    clearFeedback();

    try {
      await saveAnnualTemplate();
      setMessage(`تم حفظ الخطة الافتراضية لسنة ${planYear}.`);
      closeAnnualModal();
    } catch (saveError) {
      setAnnualError(saveError instanceof Error ? saveError.message : "تعذر حفظ القالب.");
    } finally {
      setAnnualSaving(false);
    }
  }

  async function handleApplyAnnualToCurrentMonth() {
    setAnnualSaving(true);
    setAnnualError(null);
    clearFeedback();

    try {
      await saveAnnualTemplate();
      setPlannedIncome(annualPlannedIncome);
      setNotes(annualNotes);
      setCategoryPlans({ ...annualCategoryPlans });
      setMessage("تم تطبيق الخطة الافتراضية على الشهر الحالي. احفظ لو عايز تثبتها.");
      closeAnnualModal();
    } catch (applyError) {
      setAnnualError(applyError instanceof Error ? applyError.message : "تعذر تطبيق القالب.");
    } finally {
      setAnnualSaving(false);
    }
  }

  async function handleApplyAnnualToYear() {
    setAnnualApplying(true);
    setAnnualError(null);
    clearFeedback();

    try {
      const supabase = createClient();
      await applyAnnualTemplateToYear(
        supabase,
        categories,
        planYear,
        annualPlannedIncome,
        annualNotes,
        annualCategoryPlans,
        monthStartDay,
      );
      await loadData();
      setMessage(`تم تطبيق الخطة الافتراضية على كل شهور ${planYear}.`);
      closeAnnualModal();
    } catch (applyError) {
      setAnnualError(
        applyError instanceof Error ? applyError.message : "تعذر تطبيق القالب على السنة.",
      );
    } finally {
      setAnnualApplying(false);
    }
  }

  return {
    annualModalOpen,
    annualPlannedIncome,
    annualCategoryPlans,
    annualNotes,
    annualSaving,
    annualApplying,
    annualError,
    openAnnualModal,
    closeAnnualModal,
    setAnnualPlannedIncome,
    handleAnnualCategoryPlanChange,
    setAnnualNotes,
    addAnnualCategory,
    handleSaveAnnualTemplate,
    handleApplyAnnualToCurrentMonth,
    handleApplyAnnualToYear,
  };
}
