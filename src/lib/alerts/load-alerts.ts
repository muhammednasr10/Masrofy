import { buildDashboardAlerts } from "@/lib/alerts/dashboard";
import { fetchAlertInputs } from "@/lib/alerts/fetch-inputs";
import type { Locale } from "@/i18n/config";
import { createServerFormatters } from "@/lib/i18n/profile-locale";
import { getDueRecurringTransactions } from "@/lib/recurring/schedule";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashboardAlert } from "@/lib/alerts/dashboard";
import type { RecurringTransaction } from "@/lib/types/database";

export type AlertsPanelData = {
  alerts: DashboardAlert[];
  dueRecurrings: RecurringTransaction[];
  currency: string;
};

export async function loadHeaderAlerts(
  supabase: SupabaseClient,
  userId: string | undefined,
  locale: Locale = "ar",
): Promise<AlertsPanelData> {
  if (!userId) {
    return { alerts: [], dueRecurrings: [], currency: "EGP" };
  }

  const inputs = await fetchAlertInputs(supabase);
  const { t, formatAmount } = await createServerFormatters(inputs.profile, locale);
  const currency = inputs.profile?.currency ?? "EGP";
  const dueRecurrings = getDueRecurringTransactions(inputs.dueRecurrings);

  const alerts = buildDashboardAlerts({
    planComparison: inputs.planComparison,
    investments: inputs.investments,
    wallets: inputs.wallets,
    reconciliations: inputs.reconciliations,
    formatAmount,
    t,
  });

  return { alerts, dueRecurrings, currency };
}
