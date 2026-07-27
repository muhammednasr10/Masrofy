"use client";

import { LEGAL_CONTACT_EMAIL } from "@/lib/legal";
import { getWhatsAppSupportUrl } from "@/lib/support";
import { useTranslations } from "@/components/i18n/LocaleProvider";

type AccountSupportSectionProps = {
  email: string;
  fullName: string;
};

export default function AccountSupportSection({ email, fullName }: AccountSupportSectionProps) {
  const t = useTranslations();
  const whatsappUrl = getWhatsAppSupportUrl({ email, fullName });

  return (
    <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{t("account.supportTitle")}</h3>
      <p className="mt-2 text-sm text-slate-500">{t("account.supportSubtitle")}</p>

      {whatsappUrl ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1fb855]"
        >
          <span aria-hidden>💬</span>
          {t("account.whatsappSupport")}
        </a>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {t("account.supportWhatsAppMissing")}
          </p>
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}?subject=${encodeURIComponent(t("account.supportEmailSubject"))}`}
            className="inline-flex rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
        </div>
      )}
    </section>
  );
}
