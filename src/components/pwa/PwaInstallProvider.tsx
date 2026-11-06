"use client";

import { useEffect } from "react";
import PwaInstallPrompt from "@/components/pwa/PwaInstallPrompt";
import {
  PwaInstallContextProvider,
  usePwaInstall,
} from "@/components/pwa/PwaInstallContext";
import { PWA_OPEN_INSTALL_EVENT } from "@/lib/pwa/events";

export default function PwaInstallProvider({ children }: { children: React.ReactNode }) {
  const {
    installed,
    platform,
    canInstall,
    canNativeInstall,
    promptVisible,
    installing,
    openPrompt,
    dismissPrompt,
    promptInstall,
  } = usePwaInstall();

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
        canNativeInstall={canNativeInstall}
        installing={installing}
        onClose={() => dismissPrompt(true)}
        onInstall={() => {
          void promptInstall();
        }}
      />
    </PwaInstallContextProvider>
  );
}
