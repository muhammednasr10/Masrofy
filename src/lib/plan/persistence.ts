import type { SupabaseClient } from "@supabase/supabase-js";
import { getMonthStartFromPlanMonthKey, getYearMonthKeys } from "@/lib/calendar";
import {
  buildAnnualTemplatePayloadItems,
  buildMonthlyPlanPayloadItems,
} from "@/lib/plan/annual";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import type {
  AnnualPlanTemplate,
  AnnualPlanTemplateItem,
  Category,
  MonthlyPlan,
} from "@/lib/types/database";

export function parsePlannedIncome(value: string) {
  const parsed = Number(value || 0);
  return Number.isNaN(parsed) || parsed < 0 ? null : parsed;
}

export async function persistMonthlyPlan(
  supabase: SupabaseClient,
  categories: Category[],
  monthStart: string,
  incomeValue: string,
  notesValue: string,
  plans: Record<string, string>,
) {
  const user = await requireAuthenticatedUser(supabase);
  const parsedIncome = parsePlannedIncome(incomeValue);

  if (parsedIncome === null) {
    throw new Error("أدخل دخلًا مخططًا صحيحًا.");
  }

  const { data: savedPlan, error: planError } = await supabase
    .from("monthly_plans")
    .upsert(
      {
        user_id: user.id,
        plan_month: monthStart,
        planned_income: parsedIncome,
        notes: notesValue.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,plan_month" },
    )
    .select("*")
    .single();

  if (planError || !savedPlan) {
    throw new Error(planError?.message ?? "تعذر حفظ الخطة.");
  }

  const nextItems = buildMonthlyPlanPayloadItems(categories, plans, user.id, savedPlan.id);

  const { error: deleteError } = await supabase
    .from("plan_items")
    .delete()
    .eq("plan_id", savedPlan.id);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (nextItems.length > 0) {
    const { error: insertError } = await supabase.from("plan_items").insert(nextItems);

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  return savedPlan as MonthlyPlan;
}

export async function persistAnnualTemplate(
  supabase: SupabaseClient,
  categories: Category[],
  planYear: number,
  annualPlannedIncome: string,
  annualNotes: string,
  annualCategoryPlans: Record<string, string>,
) {
  const user = await requireAuthenticatedUser(supabase);
  const parsedIncome = parsePlannedIncome(annualPlannedIncome);

  if (parsedIncome === null) {
    throw new Error("أدخل دخلًا افتراضيًا صحيحًا.");
  }

  const { data: savedTemplate, error: templateError } = await supabase
    .from("annual_plan_templates")
    .upsert(
      {
        user_id: user.id,
        plan_year: planYear,
        planned_income: parsedIncome,
        notes: annualNotes.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,plan_year" },
    )
    .select("*")
    .single();

  if (templateError || !savedTemplate) {
    throw new Error(templateError?.message ?? "تعذر حفظ القالب.");
  }

  const nextItems = buildAnnualTemplatePayloadItems(
    categories,
    annualCategoryPlans,
    user.id,
    savedTemplate.id,
  );

  const { error: deleteError } = await supabase
    .from("annual_plan_template_items")
    .delete()
    .eq("template_id", savedTemplate.id);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  let annualTemplateItems: AnnualPlanTemplateItem[] = [];

  if (nextItems.length > 0) {
    const { data: insertedItems, error: insertError } = await supabase
      .from("annual_plan_template_items")
      .insert(nextItems)
      .select("*");

    if (insertError) {
      throw new Error(insertError.message);
    }

    annualTemplateItems = (insertedItems ?? []) as AnnualPlanTemplateItem[];
  }

  return {
    template: savedTemplate as AnnualPlanTemplate,
    items: annualTemplateItems,
  };
}

export async function applyAnnualTemplateToYear(
  supabase: SupabaseClient,
  categories: Category[],
  planYear: number,
  annualPlannedIncome: string,
  annualNotes: string,
  annualCategoryPlans: Record<string, string>,
  monthStartDay: unknown = 1,
) {
  await persistAnnualTemplate(
    supabase,
    categories,
    planYear,
    annualPlannedIncome,
    annualNotes,
    annualCategoryPlans,
  );

  for (const monthKey of getYearMonthKeys(planYear)) {
    await persistMonthlyPlan(
      supabase,
      categories,
      getMonthStartFromPlanMonthKey(monthKey, monthStartDay),
      annualPlannedIncome,
      annualNotes,
      annualCategoryPlans,
    );
  }
}
