"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isIosSafari,
  isStandalonePwa,
  markInstallPromptDismissed,
  wasInstallPromptDismissedRecently,
} from "@/lib/pwa/platform";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export type PwaInstallPlatform = "chromium" | "ios" | "unsupported";

export function usePwaInstall() {
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<PwaInstallPlatform>("unsupported");
  const [canInstall, setCanInstall] = useState(false);
  const [promptVisible, setPromptVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    const standalone = isStandalonePwa();
    setInstalled(standalone);

    if (standalone) {
      setCanInstall(false);
      return;
    }

    if (isIosSafari()) {
      setPlatform("ios");
      setCanInstall(true);
      return;
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setPlatform("chromium");
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setCanInstall(true);
    }

    function handleAppInstalled() {
      setInstalled(true);
      setCanInstall(false);
      setPromptVisible(false);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const openPrompt = useCallback(() => {
    if (installed || !canInstall) {
      return;
    }

    setPromptVisible(true);
  }, [canInstall, installed]);

  const dismissPrompt = useCallback((remember = true) => {
    setPromptVisible(false);

    if (remember) {
      markInstallPromptDismissed();
    }
  }, []);

  const promptInstall = useCallback(async () => {
    if (platform === "ios") {
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    setInstalling(true);

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      if (choice.outcome === "accepted") {
        setInstalled(true);
        setCanInstall(false);
        setPromptVisible(false);
      } else {
        markInstallPromptDismissed();
        setPromptVisible(false);
      }
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt, platform]);

  return {
    installed,
    platform,
    canInstall,
    promptVisible,
    installing,
    openPrompt,
    dismissPrompt,
    promptInstall,
    wasDismissedRecently: wasInstallPromptDismissedRecently,
  };
}
