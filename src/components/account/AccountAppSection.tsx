"use client";

import { useTranslations } from "@/components/i18n/LocaleProvider";
import { usePwaInstallContext } from "@/components/pwa/PwaInstallContext";

export default function AccountAppSection() {
  const t = useTranslations();
  const { installed, canInstall, platform, openPrompt } = usePwaInstallContext();

  function handleInstallClick() {
    openPrompt();
  }

  if (installed) {
    return (
      <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">{t("account.pwaTitle")}</h3>
        <p className="mt-2 text-sm text-emerald-700">{t("account.pwaInstalled")}</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{t("account.pwaTitle")}</h3>
      <p className="mt-2 text-sm text-slate-500">{t("account.pwaSubtitle")}</p>

      {canInstall ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className="mt-4 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          {platform === "ios" ? t("account.pwaHowToInstall") : t("account.pwaInstall")}
        </button>
      ) : (
        <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {t("account.pwaUnavailable")}
        </p>
      )}
    </section>
  );
}
