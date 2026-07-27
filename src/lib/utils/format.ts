import { defaultLocale, getIntlLocale, type Locale } from "@/i18n/config";

export function formatCurrency(amount: number, currency = "EGP", locale: Locale = defaultLocale) {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string, locale: Locale = defaultLocale) {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMonthRange(referenceDate = new Date(), locale: Locale = defaultLocale) {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);

  return {
    start: formatLocalDate(start),
    end: formatLocalDate(end),
    label: new Intl.DateTimeFormat(getIntlLocale(locale), {
      month: "long",
      year: "numeric",
    }).format(referenceDate),
  };
}
