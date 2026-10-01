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
} from "@/lib/plan";
import { useAnnualPlanForm } from "@/hooks/useAnnualPlanForm";
import { useCategoryForm } from "@/hooks/useCategoryForm";
import { useSyncCompleteListener } from "@/hooks/useSyncCompleteListener";
import { useMonthPeriod } from "@/hooks/useMonthPeriod";
import { getMonthRange, normalizeMonthStartDay, parsePlanMonthKey } from "@/lib/calendar";
import { buildPlanWealthForecast, sumAnnualPlannedExpenses } from "@/lib/plan/wealth-forecast";
import {
  emptyHorizonLine,
  horizonOverlapsRange,
  isHorizonCadence,
  sumHorizonExpenses,
  type HorizonLineDraft,
} from "@/lib/plan/horizon";
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

    setHorizonPlan(typedHorizonPlan);
    setHorizonItems(typedHorizonItems);
    setHorizonLines(
      Object.fromEntries(
        typedCategories.map((category) => {
          const saved = typedHorizonItems.find((item) => item.category_id === category.id);

          return [
            category.id,
            saved
              ? {
                  amount: String(saved.planned_amount),
                  cadence: isHorizonCadence(saved.cadence) ? saved.cadence : "monthly",
                  startDate: String(saved.start_date).slice(0, 10),
                  endDate: String(saved.end_date).slice(0, 10),
                }
              : emptyHorizonLine(month.start),
          ];
        }),
      ),
    );

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
    loadData();
  }, [loadData]);

  useSyncCompleteListener(loadData);

  const comparison = useMemo(
    () =>
      buildPlanComparison({
        categories,
        plan,
        planItems,
        transactions,
        referenceDate,
        monthStartDay,
        locale,
      }),
    [categories, locale, plan, planItems, referenceDate, transactions, monthStartDay],
  );

  const wealthForecast = useMemo(() => {
    const yearEnd = getMonthRange(
      parsePlanMonthKey(`${planYear}-12`, monthStartDay),
      "en",
      monthStartDay,
    ).end;
    const savedHorizonLines = horizonItems
      .filter((item) => Number(item.planned_amount) > 0)
      .map((item) => ({
        amount: Number(item.planned_amount),
        cadence: isHorizonCadence(item.cadence) ? item.cadence : ("monthly" as const),
        startDate: String(item.start_date).slice(0, 10),
        endDate: String(item.end_date).slice(0, 10),
      }));
    const horizonApplies = savedHorizonLines.some((line) =>
      horizonOverlapsRange(line.startDate, line.endDate, month.start, yearEnd),
    );
    const templateIncome = annualTemplate ? Number(annualTemplate.planned_income) : null;
    const templateExpenses = annualTemplate
      ? sumAnnualPlannedExpenses(categories, annualTemplateItems)
      : null;
    const annualIncome = horizonApplies ? (comparison.hasPlan ? comparison.income.planned : 0) : templateIncome;
    const annualExpenses = horizonApplies ? 0 : templateExpenses;
    const monthPlanNet =
      comparison.hasPlan || annualIncome == null || annualExpenses == null
        ? comparison.balance.planned
        : annualIncome - annualExpenses;
    const forecast = buildPlanWealthForecast({
      wallets,
      transactionsBeforeMonth,
      investments,
      monthPlanNet,
      annualPlannedIncome: horizonApplies ? null : annualIncome,
      annualPlannedExpenses: horizonApplies ? null : annualExpenses,
      planMonthKey,
      planYear,
    });
    const monthlyIncome = comparison.hasPlan ? comparison.income.planned : (templateIncome ?? 0);
    const yearExpenses = horizonApplies
      ? sumHorizonExpenses(savedHorizonLines, month.start, yearEnd)
      : 0;

    return {
      ...forecast,
      expectedYearEnd: horizonApplies
        ? forecast.monthStart + forecast.monthsLeftInYear * monthlyIncome - yearExpenses
        : forecast.expectedYearEnd,
      yearForecastSource: horizonApplies ? ("horizon" as const) : annualTemplate ? ("annual" as const) : null,
    };
  }, [
    annualTemplate,
    annualTemplateItems,
    categories,
    comparison.balance.planned,
    comparison.hasPlan,
    comparison.income.planned,
    horizonItems,
    investments,
    month.start,
    monthStartDay,
    planMonthKey,
    planYear,
    transactionsBeforeMonth,
    wallets,
  ]);

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
