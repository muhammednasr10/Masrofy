import { isMissingSupabaseTableError } from "@/lib/supabase/errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Investment, InvestmentProfitEntry, InvestmentUpdate } from "@/lib/types/database";
import { normalizeInvestments, sortInvestments } from "@/lib/investments";

export type InvestmentPageData = {
  currency: string;
  investments: Investment[];
  profitEntriesByInvestment: Record<string, InvestmentProfitEntry[]>;
  valueUpdatesByInvestment: Record<string, InvestmentUpdate[]>;
  error: string | null;
};

export async function loadInvestmentPageData(
  supabase: SupabaseClient,
): Promise<InvestmentPageData> {
  const [
    { data: profile },
    { data: investmentRows, error: investmentError },
    { data: profitEntryRows, error: profitEntryError },
    { data: valueUpdateRows, error: valueUpdateError },
  ] = await Promise.all([
    supabase.from("profiles").select("currency").maybeSingle(),
    supabase.from("investments").select("*").order("sort_order", { ascending: true }),
    supabase
      .from("investment_profit_entries")
      .select("*")
      .order("period_end", { ascending: false }),
    supabase.from("investment_updates").select("*").order("recorded_at", { ascending: false }),
  ]);

  let error: string | null = investmentError?.message ?? null;

  if (
    profitEntryError &&
    !isMissingSupabaseTableError(profitEntryError, "investment_profit_entries")
  ) {
    error = profitEntryError.message;
  }

  if (valueUpdateError && !isMissingSupabaseTableError(valueUpdateError, "investment_updates")) {
    error = valueUpdateError.message;
  }

  const investments = sortInvestments(normalizeInvestments((investmentRows ?? []) as Investment[]));
  const profitEntriesByInvestment: Record<string, InvestmentProfitEntry[]> = {};
  const valueUpdatesByInvestment: Record<string, InvestmentUpdate[]> = {};

  if (!profitEntryError) {
    for (const entry of (profitEntryRows ?? []) as InvestmentProfitEntry[]) {
      const current = profitEntriesByInvestment[entry.investment_id] ?? [];
      current.push(entry);
      profitEntriesByInvestment[entry.investment_id] = current;
    }
  }

  if (!valueUpdateError) {
    for (const update of (valueUpdateRows ?? []) as InvestmentUpdate[]) {
      const current = valueUpdatesByInvestment[update.investment_id] ?? [];
      current.push(update);
      valueUpdatesByInvestment[update.investment_id] = current;
    }
  }

  return {
    currency: profile?.currency ?? "EGP",
    investments,
    profitEntriesByInvestment,
    valueUpdatesByInvestment,
    error,
  };
}
