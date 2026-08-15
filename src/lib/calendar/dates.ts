import { defaultLocale, getIntlLocale, type Locale } from "@/i18n/config";

export function parseLocalDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return new Date(
      Number(value.slice(0, 4)),
      Number(value.slice(5, 7)) - 1,
      Number(value.slice(8, 10)),
    );
  }

  return new Date(value);
}

export function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatDate(date: string, locale: Locale = defaultLocale) {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseLocalDate(date));
}
