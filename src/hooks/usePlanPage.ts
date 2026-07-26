"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usePageFeedback } from "@/hooks/usePageFeedback";
import {
  applyAnnualTemplateToYear,
  buildPlanComparison,
  categoryPlansFromItems,
  categoryPlansFromTemplateItems,
  emptyCategoryPlans,
  getPlanMonthKey,
  getPlanYear,
  parsePlanMonthKey,
  persistAnnualTemplate,
  persistMonthlyPlan,
} from "@/lib/plan";
import { useCategoryForm } from "@/hooks/useCategoryForm";
import type {
  AnnualPlanTemplate,
  AnnualPlanTemplateItem,
  Category,
  MonthlyPlan,
  PlanItem,
  Transaction,
} from "@/lib/types/database";
import { getMonthRange } from "@/lib/utils/format";

export function usePlanPage() {
  const pathname = usePathname();
  const { error, message, setError, setMessage, clearFeedback } = usePageFeedback();
  const [planMonthKey, setPlanMonthKey] = useState(() => getPlanMonthKey());
  const [categories, setCategories] = useState<Category[]>([]);
  const [plan, setPlan] = useState<MonthlyPlan | null>(null);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [annualTemplate, setAnnualTemplate] = useState<AnnualPlanTemplate | null>(null);
  const [annualTemplateItems, setAnnualTemplateItems] = useState<AnnualPlanTemplateItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currency, setCurrency] = useState("EGP");
  const [plannedIncome, setPlannedIncome] = useState("");
  const [categoryPlans, setCategoryPlans] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [annualModalOpen, setAnnualModalOpen] = useState(false);
  const [annualPlannedIncome, setAnnualPlannedIncome] = useState("");
  const [annualCategoryPlans, setAnnualCategoryPlans] = useState<Record<string, string>>({});
  const [annualNotes, setAnnualNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [annualSaving, setAnnualSaving] = useState(false);
  const [annualApplying, setAnnualApplying] = useState(false);
  const [annualError, setAnnualError] = useState<string | null>(null);

  const referenceDate = useMemo(() => parsePlanMonthKey(planMonthKey), [planMonthKey]);
  const month = useMemo(() => getMonthRange(referenceDate), [referenceDate]);
  const planYear = useMemo(() => getPlanYear(planMonthKey), [planMonthKey]);

  const loadData = useCallback(async () => {
    setLoading(true);
    clearFeedback();

    const supabase = createClient();
    const [{ data: profile }, { data: categoryRows }, { data: transactionRows }, { data: annualRow }] =
      await Promise.all([
        supabase.from("profiles").select("currency").maybeSingle(),
        supabase.from("categories").select("*").order("sort_order", { ascending: true }),
        supabase
          .from("transactions")
          .select("*, categories(name, icon, color)")
          .gte("transaction_date", month.start)
          .lte("transaction_date", month.end)
          .order("transaction_date", { ascending: false }),
        supabase
          .from("annual_plan_templates")
          .select("*")
          .eq("plan_year", planYear)
          .maybeSingle(),
      ]);

    const typedCategories = (categoryRows ?? []) as Category[];
    const typedAnnualTemplate = (annualRow as AnnualPlanTemplate | null) ?? null;
    let typedAnnualItems: AnnualPlanTemplateItem[] = [];

    if (typedAnnualTemplate) {
      const { data: annualItemRows, error: annualItemsError } = await supabase
        .from("annual_plan_template_items")
        .select("*")
        .eq("template_id", typedAnnualTemplate.id)
        .order("sort_order", { ascending: true });

      if (annualItemsError) {
        setError(annualItemsError.message);
        setLoading(false);
        return;
      }

      typedAnnualItems = (annualItemRows ?? []) as AnnualPlanTemplateItem[];
    }

    setCurrency(profile?.currency ?? "EGP");
    setCategories(typedCategories);
    setTransactions((transactionRows ?? []) as Transaction[]);
    setAnnualTemplate(typedAnnualTemplate);
    setAnnualTemplateItems(typedAnnualItems);

    const { data: planRow, error: planError } = await supabase
      .from("monthly_plans")
      .select("*")
      .eq("plan_month", month.start)
      .maybeSingle();

    if (planError) {
      setError(planError.message);
      setPlan(null);
      setPlanItems([]);
      setPlannedIncome("");
      setCategoryPlans(emptyCategoryPlans(typedCategories));
      setNotes("");
      setLoading(false);
      return;
    }

    const typedPlan = (planRow as MonthlyPlan | null) ?? null;
    setPlan(typedPlan);

    if (!typedPlan) {
      setPlanItems([]);
      if (typedAnnualTemplate) {
        setPlannedIncome(String(typedAnnualTemplate.planned_income));
        setNotes(typedAnnualTemplate.notes ?? "");
        setCategoryPlans(categoryPlansFromTemplateItems(typedCategories, typedAnnualItems));
      } else {
        setPlannedIncome("");
        setNotes("");
        setCategoryPlans(emptyCategoryPlans(typedCategories));
      }
      setLoading(false);
      return;
    }

    setPlannedIncome(String(typedPlan.planned_income));
    setNotes(typedPlan.notes ?? "");

    const { data: itemRows, error: itemsError } = await supabase
      .from("plan_items")
      .select("*, categories(name, icon, color)")
      .eq("plan_id", typedPlan.id)
      .order("sort_order", { ascending: true });

    if (itemsError) {
      setError(itemsError.message);
      setPlanItems([]);
      setCategoryPlans(emptyCategoryPlans(typedCategories));
      setLoading(false);
      return;
    }

    const typedItems = (itemRows ?? []) as PlanItem[];
    setPlanItems(typedItems);
    setCategoryPlans(categoryPlansFromItems(typedCategories, typedItems));
    setLoading(false);
  }, [clearFeedback, month.end, month.start, planYear, setError]);

  useEffect(() => {
    if (pathname === "/plan") {
      setPlanMonthKey(getPlanMonthKey());
    }
  }, [pathname]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const comparison = useMemo(
    () =>
      buildPlanComparison({
        categories,
        plan,
        planItems,
        transactions,
        referenceDate,
      }),
    [categories, plan, planItems, referenceDate, transactions],
  );

  function handleCategoryCreated(category: Category) {
    setCategories((current) => [...current, category]);
    setCategoryPlans((current) => ({
      ...current,
      [category.id]: current[category.id] ?? "",
    }));
    setAnnualCategoryPlans((current) => ({
      ...current,
      [category.id]: current[category.id] ?? "",
    }));
    setMessage(`تمت إضافة فئة "${category.name}".`);
  }

  const categoryForm = useCategoryForm(categories, handleCategoryCreated);

  function handleCategoryPlanChange(categoryId: string, value: string) {
    setCategoryPlans((current) => ({
      ...current,
      [categoryId]: value,
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
      setAnnualError(
        applyError instanceof Error ? applyError.message : "تعذر تطبيق القالب.",
      );
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

  async function handleSavePlan() {
    setSaving(true);
    clearFeedback();

    try {
      const supabase = createClient();
      const savedPlan = await persistMonthlyPlan(
        supabase,
        categories,
        month.start,
        plannedIncome,
        notes,
        categoryPlans,
      );

      const { data: itemRows, error: itemsError } = await supabase
        .from("plan_items")
        .select("*, categories(name, icon, color)")
        .eq("plan_id", savedPlan.id)
        .order("sort_order", { ascending: true });

      if (itemsError) {
        throw new Error(itemsError.message);
      }

      setPlan(savedPlan);
      setPlanItems((itemRows ?? []) as PlanItem[]);
      setMessage("تم حفظ الخطة بنجاح.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "تعذر حفظ الخطة.");
    } finally {
      setSaving(false);
    }
  }

  return {
    loading,
    saving,
    error,
    message,
    currency,
    planMonthKey,
    planYear,
    comparison,
    categories,
    plannedIncome,
    categoryPlans,
    notes,
    annualModalOpen,
    annualPlannedIncome,
    annualCategoryPlans,
    annualNotes,
    annualSaving,
    annualApplying,
    annualError,
    hasAnnualTemplate: Boolean(annualTemplate),
    setPlanMonthKey,
    setPlannedIncome,
    handleCategoryPlanChange,
    setNotes,
    handleSavePlan,
    categoryForm,
    openAnnualModal,
    closeAnnualModal,
    setAnnualPlannedIncome,
    handleAnnualCategoryPlanChange,
    setAnnualNotes,
    handleSaveAnnualTemplate,
    handleApplyAnnualToCurrentMonth,
    handleApplyAnnualToYear,
  };
}
