"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  getMonthRange,
  getPlanMonthKey,
  getPlanYear,
  parsePlanMonthKey,
} from "@/lib/calendar";

export function useCurrentMonthRange(monthStartDay: number) {
  const { locale } = useLocale();

  return useMemo(
    () => getMonthRange(new Date(), locale, monthStartDay),
    [locale, monthStartDay],
  );
}

export function useMonthPeriod(monthStartDay: number) {
  const { locale } = useLocale();
  const [planMonthKey, setPlanMonthKey] = useState(() =>
    getPlanMonthKey(new Date(), monthStartDay),
  );

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

  return {
    locale,
    planMonthKey,
    setPlanMonthKey,
    referenceDate,
    month,
    planYear,
  };
}
