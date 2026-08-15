import type { SupabaseClient } from "@supabase/supabase-js";
import { buildDefaultPlanItems } from "@/lib/onboarding/seed-plan";
import {
  ONBOARDING_CATEGORY_PRESETS,
  ONBOARDING_WALLET_TYPES,
} from "@/lib/onboarding/presets";
import type { OnboardingSetupInput } from "@/lib/onboarding/types";
import { getMonthRange } from "@/lib/calendar";

export async function completeOnboardingSetup(
  supabase: SupabaseClient,
  userId: string,
  input: OnboardingSetupInput,
) {
  const walletTypePreset = ONBOARDING_WALLET_TYPES.find(
    (item) => item.value === input.walletStep.walletType,
  );

  const { data: wallet, error: walletError } = await supabase
    .from("wallets")
    .insert({
      user_id: userId,
      name: input.walletStep.name.trim() || "محفظتي الرئيسية",
      wallet_type: input.walletStep.walletType,
      icon: input.walletStep.icon || walletTypePreset?.icon || "🏦",
      opening_balance: Number(input.walletStep.openingBalance || 0),
      is_default: true,
      sort_order: 0,
    })
    .select("*")
    .single();

  if (walletError) {
    throw walletError;
  }

  const categoriesToInsert = ONBOARDING_CATEGORY_PRESETS.filter((category) =>
    input.selectedCategories.includes(category.name),
  ).map((category, index) => ({
    user_id: userId,
    name: category.name,
    icon: category.icon,
    color: category.color,
    sort_order: index,
  }));

  if (categoriesToInsert.length > 0) {
    const { error: categoriesError } = await supabase
      .from("categories")
      .insert(categoriesToInsert);

    if (categoriesError) {
      throw categoriesError;
    }
  }

  const parsedIncome = Number(input.plannedIncome || 0);

  if (!Number.isNaN(parsedIncome) && parsedIncome > 0) {
    const month = getMonthRange();
    const { data: plan, error: planError } = await supabase
      .from("monthly_plans")
      .insert({
        user_id: userId,
        plan_month: month.start,
        planned_income: parsedIncome,
        notes: input.planNotes.trim() || null,
      })
      .select("*")
      .single();

    if (planError) {
      throw planError;
    }

    const { data: categoryRows } = await supabase
      .from("categories")
      .select("id, name")
      .eq("user_id", userId);

    const planItems = buildDefaultPlanItems(
      userId,
      plan.id,
      categoryRows ?? [],
      parsedIncome,
    );

    if (planItems.length > 0) {
      const { error: planItemsError } = await supabase.from("plan_items").insert(planItems);

      if (planItemsError) {
        throw planItemsError;
      }
    }
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      onboarding_completed: true,
      default_wallet_id: wallet.id,
    })
    .eq("id", userId);

  if (profileError) {
    throw profileError;
  }

  return wallet;
}
