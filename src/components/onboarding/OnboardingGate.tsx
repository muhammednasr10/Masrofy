"use client";

import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { OnboardingProvider, useOnboardingContext } from "@/components/onboarding/OnboardingProvider";

function OnboardingOverlay() {
  const { loading, needsOnboarding } = useOnboardingContext();

  if (loading || !needsOnboarding) {
    return null;
  }

  return <OnboardingWizard />;
}

export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingProvider>
      {children}
      <OnboardingOverlay />
    </OnboardingProvider>
  );
}
