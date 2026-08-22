"use client";

import { useMemo } from "react";
import type { Investment, Transaction, Wallet, WalletReconciliation } from "@/lib/types/database";
import {
  buildWalletDisplayRows,
  buildWalletTableRows,
  getLatestReconciliationsByWallet,
  getParentWallets,
  getReconcilableWallets,
  getTransferableWallets,
  summarizePortfolioWealth,
} from "@/lib/wallets";

export function useWalletsDerivedData(
  wallets: Wallet[],
  transactions: Transaction[],
  investments: Investment[],
  reconciliations: WalletReconciliation[],
  editingWalletId: string | null,
) {
  const defaultWalletId = useMemo(
    () => wallets.find((wallet) => wallet.is_default)?.id ?? wallets[0]?.id ?? "",
    [wallets],
  );

  const walletSortContext = useMemo(
    () => ({ transactions, investments }),
    [transactions, investments],
  );

  const walletRows = useMemo(() => buildWalletDisplayRows(wallets), [wallets]);
  const tableRows = useMemo(
    () => buildWalletTableRows(wallets, walletSortContext),
    [wallets, walletSortContext],
  );
  const parentWallets = useMemo(() => getParentWallets(wallets), [wallets]);
  const reconcilableWalletIds = useMemo(
    () => new Set(getReconcilableWallets(wallets).map((wallet) => wallet.id)),
    [wallets],
  );
  const latestReconciliations = useMemo(
    () => getLatestReconciliationsByWallet(reconciliations),
    [reconciliations],
  );
  const portfolioSummary = useMemo(
    () => summarizePortfolioWealth(wallets, transactions, investments),
    [wallets, transactions, investments],
  );
  const takenInvestmentIds = useMemo(
    () =>
      new Set(
        wallets
          .filter((wallet) => wallet.investment_id && wallet.id !== editingWalletId)
          .map((wallet) => wallet.investment_id as string),
      ),
    [wallets, editingWalletId],
  );
  const transferableWallets = useMemo(() => getTransferableWallets(wallets), [wallets]);

  return {
    defaultWalletId,
    walletRows,
    tableRows,
    parentWallets,
    reconcilableWalletIds,
    latestReconciliations,
    portfolioSummary,
    takenInvestmentIds,
    transferableWallets,
  };
}
