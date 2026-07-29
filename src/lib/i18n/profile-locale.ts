import type { Locale } from "@/i18n/config";
import { createTranslator, getMessages, type Translator } from "@/i18n/translate";
import { formatCurrency } from "@/lib/utils/format";

export function resolveProfileLocale(
  profileLocale: string | null | undefined,
  fallbackLocale: Locale,
): Locale {
  return profileLocale === "en" ? "en" : fallbackLocale;
}

export async function createServerFormatters(
  profile: { currency?: string | null; locale?: string | null } | null | undefined,
  fallbackLocale: Locale,
) {
  const currency = profile?.currency ?? "EGP";
  const locale = resolveProfileLocale(profile?.locale, fallbackLocale);
  const t: Translator = createTranslator(await getMessages(locale));
  const formatAmount = (value: number) => formatCurrency(value, currency, locale);

  return { currency, locale, t, formatAmount };
}
