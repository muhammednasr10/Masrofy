import type { SupabaseClient } from "@supabase/supabase-js";
import type { Investment } from "@/lib/types/database";

export async function persistInvestmentOrder(
  supabase: SupabaseClient,
  nextInvestments: Investment[],
) {
  const updates = nextInvestments.map((investment, index) =>
    supabase
      .from("investments")
      .update({ sort_order: index + 1 })
      .eq("id", investment.id),
  );

  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);

  if (failed?.error) {
    throw failed.error;
  }

  return nextInvestments.map((investment, index) => ({
    ...investment,
    sort_order: index + 1,
  }));
}
