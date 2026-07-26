"use client";

import { useOnboardingContext } from "@/components/onboarding/OnboardingProvider";
import OnboardingCategoryStep from "@/components/onboarding/steps/OnboardingCategoryStep";
import OnboardingPlanStep from "@/components/onboarding/steps/OnboardingPlanStep";
import OnboardingWalletStep from "@/components/onboarding/steps/OnboardingWalletStep";

export default function OnboardingWizard() {
  const {
    step,
    submitting,
    error,
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
  } = useOnboardingContext();

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4">
      <section className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-white bg-white p-5 shadow-xl sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl sm:p-8">
        <div className="mb-6">
          <p className="text-sm text-emerald-700">مرحباً بك في مصروفي</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">إعداد حسابك في 3 خطوات</h1>
          <div className="mt-4 flex gap-2">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className={`h-2 flex-1 rounded-full ${
                  item <= step ? "bg-emerald-600" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>

        {error ? (
          <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        {step === 1 ? (
          <OnboardingWalletStep walletStep={walletStep} onChange={setWalletStep} />
        ) : null}

        {step === 2 ? (
          <OnboardingCategoryStep
            selectedCategories={selectedCategories}
            onToggle={toggleCategory}
          />
        ) : null}

        {step === 3 ? (
          <OnboardingPlanStep
            plannedIncome={plannedIncome}
            planNotes={planNotes}
            onPlannedIncomeChange={setPlannedIncome}
            onPlanNotesChange={setPlanNotes}
          />
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              السابق
            </button>
          ) : null}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={step === 2 && selectedCategories.length === 0}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              التالي
            </button>
          ) : (
            <button
              type="button"
              onClick={completeOnboarding}
              disabled={submitting}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? "جاري الإعداد..." : "ابدأ استخدام مصروفي"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
