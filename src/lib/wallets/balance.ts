import type { Investment, Transaction, Wallet } from "@/lib/types/database";
import { getInvestmentWalletBalance, isInvestmentWallet } from "@/lib/wallets/investment-link";

export function isCreditWallet(wallet: Pick<Wallet, "card_kind">): boolean {
  return wallet.card_kind === "credit";
}

export function getWalletTransactionNet(
  walletId: string,
  transactions: Transaction[],
): number {
  let net = 0;

  for (const transaction of transactions) {
    if (transaction.wallet_id !== walletId) {
      continue;
    }

    const amount = Number(transaction.amount);

    if (transaction.type === "transfer") {
      net += transaction.transfer_role === "in" ? amount : -amount;
      continue;
    }

    net += transaction.type === "income" ? amount : -amount;
  }

  return net;
}

export function getCreditOwed(wallet: Wallet, transactions: Transaction[]): number {
  return Number(wallet.opening_balance) - getWalletTransactionNet(wallet.id, transactions);
}

export function calculateWalletBalance(
  wallet: Wallet,
  transactions: Transaction[],
  investments: Investment[] = [],
): number {
  if (isInvestmentWallet(wallet)) {
    return getInvestmentWalletBalance(wallet, investments);
  }

  if (isCreditWallet(wallet)) {
    return getCreditOwed(wallet, transactions);
  }

  return Number(wallet.opening_balance) + getWalletTransactionNet(wallet.id, transactions);
}

export function getWalletNetWorthContribution(
  wallet: Wallet,
  transactions: Transaction[],
  investments: Investment[] = [],
): number {
  if (isInvestmentWallet(wallet)) {
    return calculateWalletBalance(wallet, transactions, investments);
  }

  if (isCreditWallet(wallet)) {
    return -getCreditOwed(wallet, transactions);
  }

  return calculateWalletBalance(wallet, transactions, investments);
}

export function getCreditAvailable(
  wallet: Wallet,
  transactions: Transaction[],
): number | null {
  if (!isCreditWallet(wallet) || wallet.credit_limit === null) {
    return null;
  }

  return Math.max(0, Number(wallet.credit_limit) - getCreditOwed(wallet, transactions));
}

export function openingBalanceFromCurrentBalance(
  currentBalance: number,
  wallet: Pick<Wallet, "id" | "card_kind">,
  transactions: Transaction[],
): number {
  const net = getWalletTransactionNet(wallet.id, transactions);

  if (isCreditWallet(wallet as Wallet)) {
    return currentBalance + net;
  }

  return currentBalance - net;
}
