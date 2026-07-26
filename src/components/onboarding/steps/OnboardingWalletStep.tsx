"use client";

import { ONBOARDING_WALLET_TYPES } from "@/lib/onboarding/presets";
import type { OnboardingWalletStep } from "@/lib/onboarding/types";
import type { WalletType } from "@/lib/types/database";

type WalletStepProps = {
  walletStep: OnboardingWalletStep;
  onChange: (next: OnboardingWalletStep) => void;
};

export default function OnboardingWalletStep({ walletStep, onChange }: WalletStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">1. محفظتك الأولى</h2>
      <p className="text-sm text-slate-500">من أين تتابع أموالك الأساسية؟</p>

      <label className="block space-y-2">
        <span className="text-sm text-slate-600">اسم المحفظة</span>
        <input
          type="text"
          value={walletStep.name}
          onChange={(event) => onChange({ ...walletStep, name: event.target.value })}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-slate-600">النوع</span>
        <select
          value={walletStep.walletType}
          onChange={(event) => {
            const walletType = event.target.value as WalletType;
            const preset = ONBOARDING_WALLET_TYPES.find((item) => item.value === walletType);
            onChange({
              ...walletStep,
              walletType,
              icon: preset?.icon ?? walletStep.icon,
            });
          }}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        >
          {ONBOARDING_WALLET_TYPES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.icon} {item.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-slate-600">الرصيد الحالي</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={walletStep.openingBalance}
          onChange={(event) => onChange({ ...walletStep, openingBalance: event.target.value })}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        />
      </label>
    </div>
  );
}
