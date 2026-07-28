"use client";

import { useTranslations } from "@/components/i18n/LocaleProvider";
import { usePwaInstallContext } from "@/components/pwa/PwaInstallContext";

type SidebarPwaInstallButtonProps = {
  onOpen?: () => void;
};

export default function SidebarPwaInstallButton({ onOpen }: SidebarPwaInstallButtonProps) {
  const t = useTranslations();
  const { installed, canInstall, platform, openPrompt } = usePwaInstallContext();

  if (installed || !canInstall) {
    return null;
  }

  function handleClick() {
    openPrompt();
    onOpen?.();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-lg">
        📲
      </span>
      <span>
        {platform === "ios" ? t("account.pwaHowToInstall") : t("account.pwaInstall")}
      </span>
    </button>
  );
}
