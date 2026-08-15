import DashboardView from "@/components/dashboard/DashboardView";
import { loadDashboardData } from "@/lib/dashboard";
import { getServerLocale } from "@/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const locale = await getServerLocale();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const data = await loadDashboardData(supabase, user?.id, locale);

  return <DashboardView monthLabel={data.monthLabel} data={data} />;
}
