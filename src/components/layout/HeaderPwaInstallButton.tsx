"use client";

import { useTranslations } from "@/components/i18n/LocaleProvider";
import { usePwaInstallContext } from "@/components/pwa/PwaInstallContext";

export default function HeaderPwaInstallButton() {
  const t = useTranslations();
  const { installed, canInstall, openPrompt } = usePwaInstallContext();

  if (installed || !canInstall) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={openPrompt}
      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
      aria-label={t("account.pwaInstall")}
    >
      <span aria-hidden>📲</span>
      <span className="hidden sm:inline">{t("account.pwaInstall")}</span>
    </button>
  );
}
