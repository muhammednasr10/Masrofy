import { useCallback, useEffect, useState } from "react";
import DashboardView from "@/components/dashboard/DashboardView";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useSelectedMonth } from "@/components/month/SelectedMonthProvider";
import PageLoading from "@/components/ui/PageLoading";
import { useSyncCompleteListener } from "@/hooks/useSyncCompleteListener";
import { loadDashboardData, type DashboardData } from "@/lib/dashboard";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const { locale } = useLocale();
  const { referenceDate } = useSelectedMonth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useSyncCompleteListener(useCallback(() => setRefreshToken((value) => value + 1), []));

  useEffect(() => {
    setData(null);
  }, [locale, referenceDate]);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const loaded = await loadDashboardData(supabase, user?.id, locale, referenceDate);

      if (!cancelled) {
        setData(loaded);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [locale, referenceDate, refreshToken]);

  if (!data) {
    return <PageLoading label="جاري تحميل الملخص..." />;
  }

  return <DashboardView monthLabel={data.monthLabel} data={data} />;
}
