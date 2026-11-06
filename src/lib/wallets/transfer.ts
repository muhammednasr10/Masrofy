import type { Wallet } from "@/lib/types/database";

export type WalletTransferFormState = {
  fromWalletId: string;
  toWalletId: string;
  amount: string;
  note: string;
  transactionDate: string;
};

export function emptyWalletTransferForm(
  defaultFromWalletId = "",
  defaultToWalletId = "",
): WalletTransferFormState {
  return {
    fromWalletId: defaultFromWalletId,
    toWalletId: defaultToWalletId,
    amount: "",
    note: "",
    transactionDate: new Date().toISOString().slice(0, 10),
  };
}

export function prefillWalletTransferForm(
  walletIds: string[],
  defaultFromWalletId = "",
): WalletTransferFormState {
  const fromWalletId = walletIds.includes(defaultFromWalletId)
    ? defaultFromWalletId
    : (walletIds[0] ?? "");
  const toWalletId = walletIds.find((walletId) => walletId !== fromWalletId) ?? "";

  return emptyWalletTransferForm(fromWalletId, toWalletId);
}

export function getTransferableWallets(wallets: Wallet[]) {
  return wallets.filter((wallet) => wallet.wallet_type !== "investment");
}
