"use client";

import Image from "next/image";
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
      className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-2xl border border-emerald-300 bg-emerald-50 px-2.5 text-emerald-900 shadow-sm transition hover:bg-emerald-100 sm:gap-2 sm:px-3"
      aria-label={t("account.pwaInstall")}
      title={t("account.pwaInstall")}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={24}
          height={24}
          className="h-6 w-6 object-cover"
          aria-hidden
        />
      </span>
      <span className="text-xs font-semibold sm:text-sm">{label}</span>
    </button>
  );
}
