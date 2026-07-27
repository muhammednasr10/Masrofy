"use client";

import { LOCALES, localeLabels, type Locale } from "@/i18n/config";
import { useLocale, useTranslations } from "@/components/i18n/LocaleProvider";

type LanguageSwitcherProps = {
  onChanged?: (locale: Locale) => void;
  persistProfile?: boolean;
  compact?: boolean;
};

export default function LanguageSwitcher({
  onChanged,
  persistProfile = false,
  compact = false,
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();
  const t = useTranslations();

  async function handleChange(nextLocale: Locale) {
    await setLocale(nextLocale, { persistProfile });
    onChanged?.(nextLocale);
  }

  if (compact) {
    return (
      <div className="inline-flex rounded-2xl border border-slate-200 p-1">
        {LOCALES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => handleChange(item)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
              locale === item
                ? "bg-emerald-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">{t("common.language")}</span>
        <select
          value={locale}
          onChange={(event) => handleChange(event.target.value as Locale)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        >
          {LOCALES.map((item) => (
            <option key={item} value={item}>
              {localeLabels[item]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
