import type { Wallet } from "@/lib/types/database";

export function normalizeWallet(wallet: Wallet): Wallet {
  return {
    ...wallet,
    parent_wallet_id: wallet.parent_wallet_id ?? null,
    investment_id: wallet.investment_id ?? null,
    card_kind: wallet.card_kind ?? null,
    credit_limit: wallet.credit_limit ?? null,
  };
}

export function normalizeWallets(wallets: Wallet[]) {
  return wallets.map(normalizeWallet);
}

export function getWalletParentId(wallet: Pick<Wallet, "parent_wallet_id">) {
  return wallet.parent_wallet_id ?? null;
}

export function sortWallets(wallets: Wallet[]) {
  return [...wallets].sort((a, b) => a.sort_order - b.sort_order);
}
