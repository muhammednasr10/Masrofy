"use client";

import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useTranslations } from "@/components/i18n/LocaleProvider";

type AccountLanguageSectionProps = {
  onSaved?: () => void;
};

export default function AccountLanguageSection({ onSaved }: AccountLanguageSectionProps) {
  const t = useTranslations();

  return (
    <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{t("account.languageTitle")}</h3>
      <p className="mt-2 text-sm text-slate-500">{t("account.languageSubtitle")}</p>
      <div className="mt-4">
        <LanguageSwitcher persistProfile onChanged={onSaved} />
      </div>
    </section>
  );
}
