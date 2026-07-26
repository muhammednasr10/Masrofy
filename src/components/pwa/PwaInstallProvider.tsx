"use client";

import { useEffect } from "react";
import PwaInstallPrompt from "@/components/pwa/PwaInstallPrompt";
import {
  PwaInstallContextProvider,
  usePwaInstall,
} from "@/components/pwa/PwaInstallContext";
import { PWA_INSTALL_PROMPT_DELAY_MS } from "@/lib/pwa/constants";
import { PWA_OPEN_INSTALL_EVENT } from "@/lib/pwa/events";

export default function PwaInstallProvider({ children }: { children: React.ReactNode }) {
  const {
    installed,
    platform,
    canInstall,
    promptVisible,
    installing,
    openPrompt,
    dismissPrompt,
    promptInstall,
    wasDismissedRecently,
  } = usePwaInstall();

  useEffect(() => {
    if (installed || !canInstall || wasDismissedRecently()) {
      return;
    }

    const timer = window.setTimeout(() => {
      openPrompt();
    }, PWA_INSTALL_PROMPT_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [canInstall, installed, openPrompt, wasDismissedRecently]);

  useEffect(() => {
    function handleOpenInstall() {
      openPrompt();
    }

    window.addEventListener(PWA_OPEN_INSTALL_EVENT, handleOpenInstall);
    return () => {
      window.removeEventListener(PWA_OPEN_INSTALL_EVENT, handleOpenInstall);
    };
  }, [openPrompt]);

  return (
    <PwaInstallContextProvider
      value={{
        installed,
        platform,
        canInstall,
        openPrompt,
      }}
    >
      {children}
      <PwaInstallPrompt
        open={promptVisible}
        platform={platform}
        installing={installing}
        onClose={() => dismissPrompt(true)}
        onInstall={() => {
          void promptInstall();
        }}
      />
    </PwaInstallContextProvider>
  );
}
