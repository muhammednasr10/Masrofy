export const LOCALES = ["ar", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const defaultLocale: Locale = "ar";

export const LOCALE_COOKIE = "masrofy_locale";

export const localeLabels: Record<Locale, string> = {
  ar: "العربية",
  en: "English",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "ar" || value === "en";
}

export function getLocaleAttributes(locale: Locale) {
  return {
    lang: locale,
    dir: locale === "ar" ? "rtl" : "ltr",
  } as const;
}

export function getIntlLocale(locale: Locale) {
  return locale === "ar" ? "ar-EG" : "en-US";
}
