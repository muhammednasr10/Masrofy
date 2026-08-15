"use client";

import { useMemo } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getMonthRange as getMonthRangeBase } from "@/lib/calendar";
import {
  formatCurrency as formatCurrencyBase,
  formatDate as formatDateBase,
} from "@/lib/utils/format";

export function useFormat() {
  const { locale } = useLocale();

  return useMemo(
    () => ({
      locale,
      formatCurrency: (amount: number, currency = "EGP") =>
        formatCurrencyBase(amount, currency, locale),
      formatDate: (date: string) => formatDateBase(date, locale),
      getMonthRange: (referenceDate = new Date(), monthStartDay: unknown = 1) =>
        getMonthRangeBase(referenceDate, locale, monthStartDay),
    }),
    [locale],
  );
}
