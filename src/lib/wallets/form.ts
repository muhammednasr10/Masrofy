import {
  defaultWalletColor,
  defaultWalletIcon,
} from "@/lib/constants/wallet-options";
import type { CardKind, Investment, Transaction, Wallet, WalletType } from "@/lib/types/database";
import { calculateWalletBalance } from "@/lib/wallets/balance";
import { getInvestmentWalletBalance } from "@/lib/wallets/investment-link";

export type WalletFormState = {
  name: string;
  walletType: WalletType;
  icon: string;
  color: string;
  currentBalance: string;
  parentWalletId: string | null;
  investmentId: string | null;
  cardKind: CardKind | null;
  creditLimit: string;
};

export function emptyWalletForm(parentWalletId: string | null = null): WalletFormState {
  return {
    name: "",
    walletType: parentWalletId ? "card" : "bank",
    icon: parentWalletId ? "💳" : defaultWalletIcon,
    color: defaultWalletColor,
    currentBalance: "0",
    parentWalletId,
    investmentId: null,
    cardKind: parentWalletId ? "debit" : null,
    creditLimit: "",
  };
}

export function walletToForm(
  wallet: Wallet,
  transactions: Transaction[],
  investments: Investment[] = [],
): WalletFormState {
  return {
    name: wallet.name,
    walletType: wallet.wallet_type,
    icon: wallet.icon,
    color: wallet.color,
    currentBalance: String(calculateWalletBalance(wallet, transactions, investments)),
    parentWalletId: wallet.parent_wallet_id,
    investmentId: wallet.investment_id,
    cardKind: wallet.card_kind,
    creditLimit: wallet.credit_limit != null ? String(wallet.credit_limit) : "",
  };
}

export function getInvestmentFormBalance(
  form: Pick<WalletFormState, "investmentId">,
  investments: Investment[],
) {
  return getInvestmentWalletBalance(
    {
      wallet_type: "investment",
      investment_id: form.investmentId,
      opening_balance: 0,
    } as Wallet,
    investments,
  );
}

export function buildWalletPayload(form: WalletFormState) {
  const isSubWallet = Boolean(form.parentWalletId);
  const isInvestmentWallet = !isSubWallet && form.walletType === "investment";

  return {
    name: form.name.trim(),
    wallet_type: isSubWallet ? ("card" as const) : form.walletType,
    icon: form.icon,
    color: form.color,
    opening_balance: isInvestmentWallet ? 0 : Number(form.currentBalance) || 0,
    parent_wallet_id: form.parentWalletId,
    investment_id: isInvestmentWallet ? form.investmentId : null,
    card_kind: isSubWallet ? form.cardKind : null,
    credit_limit:
      isSubWallet && form.cardKind === "credit" && form.creditLimit.trim()
        ? Number(form.creditLimit) || 0
        : null,
  };
}
