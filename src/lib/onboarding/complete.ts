import type { SupabaseClient } from "@supabase/supabase-js";
import { buildDefaultPlanItems } from "@/lib/onboarding/seed-plan";
import { ONBOARDING_WALLET_TYPES } from "@/lib/onboarding/presets";
import { fallbackDefaultCategories, rootCatalogCategories } from "@/lib/categories/catalog";
import type { OnboardingSetupInput } from "@/lib/onboarding/types";
import type { DefaultCategory } from "@/lib/types/database";
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

  const { data: catalogRows } = await supabase
    .from("default_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const catalog =
    catalogRows && catalogRows.length > 0
      ? (catalogRows as DefaultCategory[])
      : fallbackDefaultCategories();

  const selectedNames = new Set(input.selectedCategories);
  const roots = rootCatalogCategories(catalog).filter((category) => selectedNames.has(category.name));
  const selectedRootNames = new Set(roots.map((category) => category.name));
  const children = catalog.filter(
    (category) => category.parent_name && selectedRootNames.has(category.parent_name),
  );

  if (roots.length > 0) {
    const { data: insertedRoots, error: rootError } = await supabase
      .from("categories")
      .insert(
        roots.map((category, index) => ({
          user_id: userId,
          name: category.name,
          icon: category.icon,
          color: category.color,
          sort_order: index,
        })),
      )
      .select("id, name");

    if (rootError) {
      throw rootError;
    }

    const rootIdByName = new Map((insertedRoots ?? []).map((row) => [row.name as string, row.id as string]));
    const childRows = children
      .map((category, index) => {
        const parentId = category.parent_name ? rootIdByName.get(category.parent_name) : null;

        if (!parentId) {
          return null;
        }

        return {
          user_id: userId,
          name: category.name,
          icon: category.icon,
          color: category.color,
          parent_category_id: parentId,
          sort_order: index + 1,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (childRows.length > 0) {
      const { error: childError } = await supabase.from("categories").insert(childRows);

      if (childError) {
        throw childError;
      }
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
