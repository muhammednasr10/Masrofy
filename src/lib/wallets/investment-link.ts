import type { Investment, Wallet } from "@/lib/types/database";
import {
  getInvestmentDisplayValue,
  summarizeInvestments,
} from "@/lib/investments/utils";

export function isInvestmentWallet(wallet: Pick<Wallet, "wallet_type">): boolean {
  return wallet.wallet_type === "investment";
}

export function getInvestmentWalletBalance(
  wallet: Wallet,
  investments: Investment[],
): number {
  if (wallet.investment_id) {
    const investment = investments.find((item) => item.id === wallet.investment_id);

    if (investment) {
      return getInvestmentDisplayValue(investment);
    }
  }

  if (investments.length === 0) {
    return Number(wallet.opening_balance);
  }

  return summarizeInvestments(investments).totalCurrentValue;
}

export function getInvestmentsPageHref(wallet: Pick<Wallet, "investment_id">) {
  return wallet.investment_id
    ? `/investments?wallet=${wallet.investment_id}`
    : "/investments";
}
