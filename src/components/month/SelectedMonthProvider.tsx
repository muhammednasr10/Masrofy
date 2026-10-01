"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { Locale } from "@/i18n/config";
import {
  getMonthRange,
  getPlanMonthKey,
  getPlanYear,
  normalizeMonthStartDay,
  parsePlanMonthKey,
  type MonthRange,
} from "@/lib/calendar";
import {
  isPlanMonthKey,
  readStoredPlanMonthKey,
  SELECTED_MONTH_STORAGE_KEY,
} from "@/lib/calendar/selected-month";
import { createClient } from "@/lib/supabase/client";

type SelectedMonthContextValue = {
  locale: Locale;
  planMonthKey: string;
  setPlanMonthKey: (planMonthKey: string) => void;
  monthStartDay: number;
  setMonthStartDay: (monthStartDay: unknown) => void;
  referenceDate: Date;
  month: MonthRange;
  planYear: number;
};

const SelectedMonthContext = createContext<SelectedMonthContextValue | null>(null);

function readInitialPlanMonthKey() {
  if (typeof sessionStorage === "undefined") {
    return getPlanMonthKey(new Date(), 1);
  }

  return readStoredPlanMonthKey(sessionStorage) ?? getPlanMonthKey(new Date(), 1);
}

export function SelectedMonthProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();
  const [planMonthKey, setPlanMonthKeyState] = useState(readInitialPlanMonthKey);
  const [monthStartDay, setMonthStartDayState] = useState(1);

  const setPlanMonthKey = useCallback((nextKey: string) => {
    if (!isPlanMonthKey(nextKey)) {
      return;
    }

    setPlanMonthKeyState(nextKey);

    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(SELECTED_MONTH_STORAGE_KEY, nextKey);
    }
  }, []);

  const setMonthStartDay = useCallback((value: unknown) => {
    const nextDay = normalizeMonthStartDay(value);
    setMonthStartDayState((current) => (current === nextDay ? current : nextDay));
  }, []);

  useEffect(() => {
    const supabase = createClient();

    void supabase
      .from("profiles")
      .select("month_start_day")
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setMonthStartDay(data.month_start_day);
        }
      });
  }, [setMonthStartDay]);

  const referenceDate = useMemo(
    () => parsePlanMonthKey(planMonthKey, monthStartDay),
    [monthStartDay, planMonthKey],
  );
  const month = useMemo(
    () => getMonthRange(referenceDate, locale, monthStartDay),
    [locale, monthStartDay, referenceDate],
  );
  const planYear = useMemo(
    () => getPlanYear(planMonthKey, monthStartDay),
    [monthStartDay, planMonthKey],
  );

  const value = useMemo(
    () => ({
      locale,
      planMonthKey,
      setPlanMonthKey,
      monthStartDay,
      setMonthStartDay,
      referenceDate,
      month,
      planYear,
    }),
    [locale, month, monthStartDay, planMonthKey, planYear, referenceDate, setMonthStartDay, setPlanMonthKey],
  );

  return <SelectedMonthContext.Provider value={value}>{children}</SelectedMonthContext.Provider>;
}

export function useSelectedMonth() {
  const value = useContext(SelectedMonthContext);

  if (!value) {
    throw new Error("useSelectedMonth must be used within SelectedMonthProvider");
  }

  return value;
}
