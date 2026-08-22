import { walletTypeOptions } from "@/lib/constants/wallet-options";
import type { Wallet } from "@/lib/types/database";
import { getWalletTypeLabel } from "@/lib/wallets/hierarchy";

export function resolveWalletDisplayLabel(wallet: Wallet) {
  return (
    getWalletTypeLabel(wallet) ??
    walletTypeOptions.find((item) => item.value === wallet.wallet_type)?.label ??
    wallet.wallet_type
  );
}
