"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useOnboarding } from "@/hooks/useOnboarding";

const OnboardingContext = createContext<ReturnType<typeof useOnboarding> | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const value = useOnboarding();

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error("useOnboardingContext must be used within OnboardingProvider");
  }

  return context;
}
