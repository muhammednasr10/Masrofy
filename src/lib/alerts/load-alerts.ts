import { buildDashboardAlerts } from "@/lib/alerts/dashboard";
import { fetchAlertInputs } from "@/lib/alerts/fetch-inputs";
import type { Locale } from "@/i18n/config";
import { createServerFormatters } from "@/lib/i18n/profile-locale";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashboardAlert } from "@/lib/alerts/dashboard";

export async function loadHeaderAlerts(
  supabase: SupabaseClient,
  userId: string | undefined,
  locale: Locale = "ar",
): Promise<DashboardAlert[]> {
  if (!userId) {
    return [];
  }

  const inputs = await fetchAlertInputs(supabase);
  const { t, formatAmount } = await createServerFormatters(inputs.profile, locale);

  return buildDashboardAlerts({
    planComparison: inputs.planComparison,
    investments: inputs.investments,
    wallets: inputs.wallets,
    reconciliations: inputs.reconciliations,
    formatAmount,
    dueRecurringCount: inputs.dueRecurringCount,
    t,
  });
}
