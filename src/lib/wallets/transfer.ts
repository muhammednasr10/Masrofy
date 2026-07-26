import type { Wallet } from "@/lib/types/database";

export type WalletTransferFormState = {
  fromWalletId: string;
  toWalletId: string;
  amount: string;
  note: string;
  transactionDate: string;
};

export function emptyWalletTransferForm(defaultFromWalletId = ""): WalletTransferFormState {
  return {
    fromWalletId: defaultFromWalletId,
    toWalletId: "",
    amount: "",
    note: "",
    transactionDate: new Date().toISOString().slice(0, 10),
  };
}

export function getTransferableWallets(wallets: Wallet[]) {
  return wallets.filter((wallet) => wallet.wallet_type !== "investment");
}
