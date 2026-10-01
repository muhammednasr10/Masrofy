import type { SupabaseClient } from "@supabase/supabase-js";
import { getMonthStartFromPlanMonthKey, getYearMonthKeys } from "@/lib/calendar";
import {
  buildAnnualTemplatePayloadItems,
  buildMonthlyPlanPayloadItems,
} from "@/lib/plan/annual";
import { isDateKey, isHorizonCadence, type HorizonLineDraft } from "@/lib/plan/horizon";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import type {
  AnnualPlanTemplate,
  AnnualPlanTemplateItem,
  Category,
  HorizonPlan,
  HorizonPlanItem,
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

export async function persistHorizonPlan(
  supabase: SupabaseClient,
  categories: Category[],
  lines: Record<string, HorizonLineDraft>,
) {
  const user = await requireAuthenticatedUser(supabase);

  const nextItems = categories.flatMap((category, index) => {
    const line = lines[category.id];
    const amount = Number(line?.amount || 0);

    if (amount <= 0) {
      return [];
    }

    if (!line || !isDateKey(line.startDate) || !isDateKey(line.endDate) || line.endDate < line.startDate) {
      throw new Error(`حدّد يوم بداية ويوم نهاية لفئة ${category.name}، والنهاية بعد البداية.`);
    }

    return [
      {
        user_id: user.id,
        plan_id: "",
        category_id: category.id,
        planned_amount: amount,
        cadence: isHorizonCadence(line.cadence) ? line.cadence : "monthly",
        start_date: line.startDate,
        end_date: line.endDate,
        sort_order: index + 1,
      },
    ];
  });

  const { data: savedPlan, error: planError } = await supabase
    .from("horizon_plans")
    .upsert(
      {
        user_id: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (planError || !savedPlan) {
    const missingTable = planError?.code === "42P01" || planError?.message?.includes("horizon_plans");
    throw new Error(
      missingTable
        ? "جداول الخطة الكاملة لسه مش موجودة. طبّق ملف الهجرة 030 من مجلد supabase/migrations ثم احفظ تاني."
        : (planError?.message ?? "تعذر حفظ الخطة الكاملة."),
    );
  }

  const rows = nextItems.map((item) => ({ ...item, plan_id: savedPlan.id }));

  const { error: deleteError } = await supabase
    .from("horizon_plan_items")
    .delete()
    .eq("plan_id", savedPlan.id);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  let items: HorizonPlanItem[] = [];

  if (rows.length > 0) {
    const { data: insertedItems, error: insertError } = await supabase
      .from("horizon_plan_items")
      .insert(rows)
      .select("*");

    if (insertError) {
      throw new Error(insertError.message);
    }

    items = (insertedItems ?? []) as HorizonPlanItem[];
  }

  return {
    plan: savedPlan as HorizonPlan,
    items,
  };
}
