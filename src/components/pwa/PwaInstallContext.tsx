"use client";

import { createContext, useContext } from "react";
import { usePwaInstall, type PwaInstallPlatform } from "@/hooks/usePwaInstall";

type PwaInstallContextValue = {
  installed: boolean;
  platform: PwaInstallPlatform;
  canInstall: boolean;
  openPrompt: () => void;
};

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

export function PwaInstallContextProvider({
  value,
  children,
}: {
  value: PwaInstallContextValue;
  children: React.ReactNode;
}) {
  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
}

export function usePwaInstallContext() {
  const context = useContext(PwaInstallContext);

  if (!context) {
    throw new Error("usePwaInstallContext must be used within PwaInstallProvider");
  }

  return context;
}

export function useOptionalPwaInstallContext() {
  return useContext(PwaInstallContext);
}

export { usePwaInstall };
