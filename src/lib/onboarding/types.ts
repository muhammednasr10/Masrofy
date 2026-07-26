import type { WalletType } from "@/lib/types/database";

export type OnboardingWalletStep = {
  name: string;
  walletType: WalletType;
  openingBalance: string;
  icon: string;
};

export type OnboardingSetupInput = {
  walletStep: OnboardingWalletStep;
  selectedCategories: string[];
  plannedIncome: string;
  planNotes: string;
};
