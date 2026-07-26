import type { Transaction, Wallet } from "@/lib/types/database";
import {
  calculateWalletBalance,
  getCreditAvailable,
  isCreditWallet,
} from "@/lib/wallets/balance";
import { getWalletTypeLabel } from "@/lib/wallets/hierarchy";
import { getWalletParentId } from "@/lib/wallets/normalize";

export function findWallet(
  wallets: Wallet[],
  walletId: string | null | undefined,
) {
  if (!walletId) {
    return null;
  }

  return wallets.find((wallet) => wallet.id === walletId) ?? null;
}

export function getWalletParent(wallets: Wallet[], wallet: Wallet | null) {
  if (!wallet) {
    return null;
  }

  return findWallet(wallets, getWalletParentId(wallet));
}

export function getTransactionWalletDisplay(
  wallets: Wallet[],
  walletId: string | null | undefined,
) {
  const wallet = findWallet(wallets, walletId);

  if (!wallet) {
    return null;
  }

  return {
    wallet,
    parent: getWalletParent(wallets, wallet),
    typeLabel: getWalletTypeLabel(wallet),
    isCredit: isCreditWallet(wallet),
  };
}

export function getSelectedWalletSnapshot(
  wallets: Wallet[],
  walletId: string,
  transactions: Pick<Transaction, "wallet_id" | "amount" | "type">[],
) {
  const wallet = findWallet(wallets, walletId);

  if (!wallet) {
    return null;
  }

  return {
    wallet,
    parent: getWalletParent(wallets, wallet),
    typeLabel: getWalletTypeLabel(wallet),
    isCredit: isCreditWallet(wallet),
    balance: calculateWalletBalance(wallet, transactions as Transaction[]),
    creditAvailable: getCreditAvailable(wallet, transactions as Transaction[]),
  };
}

export function getCreditTransactionHint(type: Transaction["type"]) {
  if (type === "expense") {
    return "المصروف على الكريديت يزيد المبلغ المستحق.";
  }

  return "الدخل على الكريديت يُعتبر سدادًا ويقلّل المستحق.";
}
