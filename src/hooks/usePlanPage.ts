"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePageFeedback } from "@/hooks/usePageFeedback";
import {
  buildPlanComparison,
  categoryPlansFromItems,
  categoryPlansFromTemplateItems,
  emptyCategoryPlans,
  persistHorizonPlan,
  persistMonthlyPlan,
  rollCategoryPlansToParents,
} from "@/lib/plan";
import { useAnnualPlanForm } from "@/hooks/useAnnualPlanForm";
import { useCategoryForm } from "@/hooks/useCategoryForm";
import { useSyncCompleteListener } from "@/hooks/useSyncCompleteListener";
import { useMonthPeriod } from "@/hooks/useMonthPeriod";
import { normalizeMonthStartDay } from "@/lib/calendar";
import { emptyHorizonLine, type HorizonLineDraft } from "@/lib/plan/horizon";
import { horizonLinesFromItems } from "@/lib/plan/horizon-lines";
import { buildHorizonMonthPlan, horizonMonthPlanRecords } from "@/lib/plan/month-from-horizon";
import { buildPlanPageWealthForecast } from "@/lib/plan/plan-page-forecast";
import type {
  AnnualPlanTemplate,
  AnnualPlanTemplateItem,
  Category,
  HorizonPlan,
  HorizonPlanItem,
  Investment,
  MonthlyPlan,
  PlanItem,
  Transaction,
  Wallet,
} from "@/lib/types/database";

export function usePlanPage() {
  const { error, message, setError, setMessage, clearFeedback } = usePageFeedback();
  const {
    locale,
    planMonthKey,
    setPlanMonthKey,
    referenceDate,
    month,
    planYear,
    setMonthStartDay,
    monthStartDay,
  } = useMonthPeriod();
  const [categories, setCategories] = useState<Category[]>([]);
  const [plan, setPlan] = useState<MonthlyPlan | null>(null);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [annualTemplate, setAnnualTemplate] = useState<AnnualPlanTemplate | null>(null);
  const [annualTemplateItems, setAnnualTemplateItems] = useState<AnnualPlanTemplateItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsBeforeMonth, setTransactionsBeforeMonth] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [currency, setCurrency] = useState("EGP");
  const [plannedIncome, setPlannedIncome] = useState("");
  const [categoryPlans, setCategoryPlans] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [horizonPlan, setHorizonPlan] = useState<HorizonPlan | null>(null);
  const [horizonLines, setHorizonLines] = useState<Record<string, HorizonLineDraft>>({});
  const [horizonItems, setHorizonItems] = useState<HorizonPlanItem[]>([]);
  const [horizonSaving, setHorizonSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    clearFeedback();

    const supabase = createClient();
    const [
      { data: profile },
      { data: categoryRows },
      { data: transactionRows },
      { data: priorTransactionRows },
      { data: walletRows },
      { data: investmentRows },
      { data: annualRow },
      { data: horizonRow },
    ] = await Promise.all([
        supabase.from("profiles").select("currency, month_start_day").maybeSingle(),
        supabase.from("categories").select("*").order("sort_order", { ascending: true }),
        supabase
          .from("transactions")
          .select("*, categories(name, icon, color)")
          .gte("transaction_date", month.start)
          .lte("transaction_date", month.end)
          .order("transaction_date", { ascending: false }),
        supabase.from("transactions").select("*").lt("transaction_date", month.start),
        supabase.from("wallets").select("*"),
        supabase.from("investments").select("*"),
        supabase
          .from("annual_plan_templates")
          .select("*")
          .eq("plan_year", planYear)
          .maybeSingle(),
        supabase.from("horizon_plans").select("*").maybeSingle(),
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

    const typedHorizonPlan = (horizonRow as HorizonPlan | null) ?? null;
    let typedHorizonItems: HorizonPlanItem[] = [];

    if (typedHorizonPlan) {
      const { data: horizonItemRows, error: horizonItemsError } = await supabase
        .from("horizon_plan_items")
        .select("*")
        .eq("plan_id", typedHorizonPlan.id)
        .order("sort_order", { ascending: true });

      if (horizonItemsError) {
        setError(horizonItemsError.message);
        setLoading(false);
        return;
      }

      typedHorizonItems = (horizonItemRows ?? []) as HorizonPlanItem[];
    }

    const horizonLinesForMonth = horizonLinesFromItems(
      typedCategories,
      typedHorizonItems,
      month.start,
    );
    const horizonMonth = buildHorizonMonthPlan(
      typedCategories,
      horizonLinesForMonth,
      month.start,
      month.end,
    );

    setHorizonPlan(typedHorizonPlan);
    setHorizonItems(typedHorizonItems);
    setHorizonLines(horizonLinesForMonth);

    function applyMonthDrafts(income: string, plans: Record<string, string>, noteText: string) {
      if (horizonMonth.usesHorizon) {
        setPlannedIncome(horizonMonth.plannedIncome > 0 ? String(horizonMonth.plannedIncome) : "");
        setCategoryPlans(
          rollCategoryPlansToParents(typedCategories, horizonMonth.plannedByCategory),
        );
        setNotes(noteText);
        return;
      }

      setPlannedIncome(income);
      setCategoryPlans(plans);
      setNotes(noteText);
    }

    setCurrency(profile?.currency ?? "EGP");
    setMonthStartDay(normalizeMonthStartDay(profile?.month_start_day));
    setCategories(typedCategories);
    setTransactions((transactionRows ?? []) as Transaction[]);
    setTransactionsBeforeMonth((priorTransactionRows ?? []) as Transaction[]);
    setWallets((walletRows ?? []) as Wallet[]);
    setInvestments((investmentRows ?? []) as Investment[]);
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
      applyMonthDrafts("", emptyCategoryPlans(typedCategories), "");
      setLoading(false);
      return;
    }

    const typedPlan = (planRow as MonthlyPlan | null) ?? null;
    setPlan(typedPlan);

    if (!typedPlan) {
      setPlanItems([]);
      if (typedAnnualTemplate) {
        applyMonthDrafts(
          String(typedAnnualTemplate.planned_income),
          categoryPlansFromTemplateItems(typedCategories, typedAnnualItems),
          typedAnnualTemplate.notes ?? "",
        );
      } else {
        applyMonthDrafts("", emptyCategoryPlans(typedCategories), "");
      }
      setLoading(false);
      return;
    }

    const savedIncome = String(typedPlan.planned_income);
    const savedNotes = typedPlan.notes ?? "";

    const { data: itemRows, error: itemsError } = await supabase
      .from("plan_items")
      .select("*, categories(name, icon, color)")
      .eq("plan_id", typedPlan.id)
      .order("sort_order", { ascending: true });

    if (itemsError) {
      setError(itemsError.message);
      setPlanItems([]);
      applyMonthDrafts(savedIncome, emptyCategoryPlans(typedCategories), savedNotes);
      setLoading(false);
      return;
    }

    const typedItems = (itemRows ?? []) as PlanItem[];
    setPlanItems(typedItems);
    applyMonthDrafts(savedIncome, categoryPlansFromItems(typedCategories, typedItems), savedNotes);
    setLoading(false);
  }, [clearFeedback, month.end, month.start, planYear, setError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useSyncCompleteListener(loadData);

  const comparison = useMemo(() => {
    const horizonMonth = buildHorizonMonthPlan(categories, horizonLines, month.start, month.end);
    const horizonRecords = horizonMonth.usesHorizon
      ? horizonMonth.hasAmount
        ? horizonMonthPlanRecords(horizonMonth.plannedIncome, horizonMonth.plannedByCategory, month.start)
        : { plan: null, planItems: [] as PlanItem[] }
      : null;

    return buildPlanComparison({
      categories,
      plan: horizonRecords ? horizonRecords.plan : plan,
      planItems: horizonRecords ? horizonRecords.planItems : planItems,
      transactions,
      referenceDate,
      monthStartDay,
      locale,
    });
  }, [
    categories,
    horizonLines,
    locale,
    month.end,
    month.start,
    monthStartDay,
    plan,
    planItems,
    referenceDate,
    transactions,
  ]);

  const wealthForecast = useMemo(
    () =>
      buildPlanPageWealthForecast({
        categories,
        comparison,
        horizonItems,
        annualTemplate,
        annualTemplateItems,
        wallets,
        transactionsBeforeMonth,
        investments,
        monthStart: month.start,
        monthStartDay,
        planMonthKey,
        planYear,
      }),
    [
      annualTemplate,
      annualTemplateItems,
      categories,
      comparison,
      horizonItems,
      investments,
      month.start,
      monthStartDay,
      planMonthKey,
      planYear,
      transactionsBeforeMonth,
      wallets,
    ],
  );

  const { addAnnualCategory, ...annual } = useAnnualPlanForm({
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
  });

  function handleCategoryCreated(category: Category) {
    setCategories((current) => [...current, category]);
    setCategoryPlans((current) => ({
      ...current,
      [category.id]: current[category.id] ?? "",
    }));
    addAnnualCategory(category.id);
    setHorizonLines((current) => ({
      ...current,
      [category.id]: current[category.id] ?? emptyHorizonLine(month.start),
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

  async function handleSaveHorizonPlan() {
    setHorizonSaving(true);
    clearFeedback();

    try {
      const supabase = createClient();
      const saved = await persistHorizonPlan(supabase, categories, horizonLines);
      setHorizonPlan(saved.plan);
      setHorizonItems(saved.items);
      setMessage("تم حفظ الخطة الكاملة.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "تعذر حفظ الخطة الكاملة.");
    } finally {
      setHorizonSaving(false);
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
    locale,
    planMonthKey,
    planYear,
    monthStart: month.start,
    monthEnd: month.end,
    comparison,
    wealthForecast,
    horizonLines,
    horizonSaving,
    hasHorizonPlan: Boolean(horizonPlan),
    setHorizonLine: (categoryId: string, patch: Partial<HorizonLineDraft>) => {
      setHorizonLines((current) => {
        const line = current[categoryId] ?? emptyHorizonLine(month.start);

        return {
          ...current,
          [categoryId]: { ...line, ...patch },
        };
      });
    },
    handleSaveHorizonPlan,
    wallets,
    categories,
    plannedIncome,
    categoryPlans,
    notes,
    hasAnnualTemplate: Boolean(annualTemplate),
    monthStartDay,
    setPlanMonthKey,
    setPlannedIncome,
    handleCategoryPlanChange,
    setNotes,
    handleSavePlan,
    categoryForm,
    ...annual,
  };
}
