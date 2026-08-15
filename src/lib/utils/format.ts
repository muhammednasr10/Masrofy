import { defaultLocale, getIntlLocale, type Locale } from "@/i18n/config";
import { formatDate as formatDateBase } from "@/lib/calendar/dates";

export function formatCurrency(amount: number, currency = "EGP", locale: Locale = defaultLocale) {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string, locale: Locale = defaultLocale) {
  return formatDateBase(date, locale);
}

export { getMonthRange, normalizeMonthStartDay } from "@/lib/calendar/month-cycle";
