import type { Investment, Transaction, Wallet } from "@/lib/types/database";
import { getInvestmentWalletBalance, isInvestmentWallet } from "@/lib/wallets/investment-link";

export function isCreditWallet(wallet: Pick<Wallet, "card_kind">): boolean {
  return wallet.card_kind === "credit";
}

function localDateKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function getWalletTransactionNet(
  walletId: string,
  transactions: Transaction[],
  asOf = localDateKey(),
): number {
  let net = 0;

  for (const transaction of transactions) {
    if (transaction.wallet_id !== walletId || transaction.transaction_date.slice(0, 10) > asOf) {
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

export function getCreditOwed(wallet: Wallet, transactions: Transaction[], asOf = localDateKey()): number {
  return Number(wallet.opening_balance) - getWalletTransactionNet(wallet.id, transactions, asOf);
}

export function calculateWalletBalance(
  wallet: Wallet,
  transactions: Transaction[],
  investments: Investment[] = [],
  asOf = localDateKey(),
): number {
  if (isInvestmentWallet(wallet)) {
    return getInvestmentWalletBalance(wallet, investments);
  }

  if (isCreditWallet(wallet)) {
    return getCreditOwed(wallet, transactions, asOf);
  }

  return Number(wallet.opening_balance) + getWalletTransactionNet(wallet.id, transactions, asOf);
}

export function getWalletNetWorthContribution(
  wallet: Wallet,
  transactions: Transaction[],
  investments: Investment[] = [],
  asOf = localDateKey(),
): number {
  if (isInvestmentWallet(wallet)) {
    return calculateWalletBalance(wallet, transactions, investments, asOf);
  }

  if (isCreditWallet(wallet)) {
    return -getCreditOwed(wallet, transactions, asOf);
  }

  return calculateWalletBalance(wallet, transactions, investments, asOf);
}

export function getCreditAvailable(
  wallet: Wallet,
  transactions: Transaction[],
  asOf = localDateKey(),
): number | null {
  if (!isCreditWallet(wallet) || wallet.credit_limit === null) {
    return null;
  }

  return Math.max(0, Number(wallet.credit_limit) - getCreditOwed(wallet, transactions, asOf));
}

export function openingBalanceFromCurrentBalance(
  currentBalance: number,
  wallet: Pick<Wallet, "id" | "card_kind">,
  transactions: Transaction[],
  asOf = localDateKey(),
): number {
  const net = getWalletTransactionNet(wallet.id, transactions, asOf);

  if (isCreditWallet(wallet as Wallet)) {
    return currentBalance + net;
  }

  return currentBalance - net;
}
