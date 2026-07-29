import DashboardView from "@/components/dashboard/DashboardView";
import { loadDashboardData } from "@/lib/dashboard";
import { getServerLocale } from "@/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { getMonthRange } from "@/lib/utils/format";

export default async function DashboardPage() {
  const supabase = await createClient();
  const locale = await getServerLocale();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const data = await loadDashboardData(supabase, user?.id, locale);
  const monthLabel = getMonthRange(new Date(), locale).label;

  return <DashboardView monthLabel={monthLabel} data={data} />;
}
