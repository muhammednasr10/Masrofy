"use client";

import { useTranslations } from "@/components/i18n/LocaleProvider";
import { usePwaInstallContext } from "@/components/pwa/PwaInstallContext";

export default function HeaderPwaInstallButton() {
  const t = useTranslations();
  const { installed, canInstall, platform, openPrompt } = usePwaInstallContext();

  if (installed || !canInstall) {
    return null;
  }

  const label =
    platform === "ios" ? t("account.pwaInstallShortIos") : t("account.pwaInstallShort");

  return (
    <button
      type="button"
      onClick={openPrompt}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-300 bg-emerald-50 text-emerald-900 shadow-sm transition hover:bg-emerald-100 sm:h-10 sm:w-auto sm:gap-2 sm:px-3"
      aria-label={t("account.pwaInstall")}
      title={t("account.pwaInstall")}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
        <img src="/icons/icon-192.png" alt="" className="h-6 w-6 object-cover" aria-hidden />
      </span>
      <span className="hidden text-xs font-semibold sm:inline sm:text-sm">{label}</span>
    </button>
  );
}
