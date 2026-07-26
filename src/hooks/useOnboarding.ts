"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { completeOnboardingSetup } from "@/lib/onboarding/complete";
import { ONBOARDING_CATEGORY_PRESETS } from "@/lib/onboarding/presets";
import type { OnboardingWalletStep } from "@/lib/onboarding/types";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import { usePageFeedback } from "@/hooks/usePageFeedback";

export function useOnboarding() {
  const router = useRouter();
  const { error, message, setError, setMessage, clearFeedback } = usePageFeedback();
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [currency, setCurrency] = useState("EGP");
  const [walletStep, setWalletStep] = useState<OnboardingWalletStep>({
    name: "محفظتي الرئيسية",
    walletType: "bank",
    openingBalance: "0",
    icon: "🏦",
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    ONBOARDING_CATEGORY_PRESETS.map((category) => category.name),
  );
  const [plannedIncome, setPlannedIncome] = useState("");
  const [planNotes, setPlanNotes] = useState("");

  const checkOnboarding = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, currency")
      .maybeSingle();

    setCurrency(profile?.currency ?? "EGP");
    setNeedsOnboarding(!(profile?.onboarding_completed ?? true));
    setLoading(false);
  }, []);

  useEffect(() => {
    checkOnboarding();
  }, [checkOnboarding]);

  function toggleCategory(name: string) {
    setSelectedCategories((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );
  }

  async function completeOnboarding() {
    setSubmitting(true);
    clearFeedback();

    try {
      const supabase = createClient();
      const user = await requireAuthenticatedUser(supabase);

      await completeOnboardingSetup(supabase, user.id, {
        walletStep,
        selectedCategories,
        plannedIncome,
        planNotes,
      });

      setNeedsOnboarding(false);
      setMessage("تم إعداد حسابك بنجاح.");
      router.refresh();
    } catch (setupError) {
      setError(setupError instanceof Error ? setupError.message : "تعذر إكمال الإعداد.");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    loading,
    needsOnboarding,
    step,
    submitting,
    error,
    message,
    currency,
    walletStep,
    selectedCategories,
    plannedIncome,
    planNotes,
    setStep,
    setWalletStep,
    toggleCategory,
    setPlannedIncome,
    setPlanNotes,
    completeOnboarding,
  };
}
