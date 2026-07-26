import type { Investment, Transaction, Wallet, WalletReconciliation } from "@/lib/types/database";
import {
  calculateWalletBalance,
  getCreditAvailable,
  getCreditOwed,
  isCreditWallet,
} from "@/lib/wallets/balance";
import {
  buildWalletDisplayRows,
  getAggregatedSubWalletSummary,
  type ParentWalletBalanceSummary,
  walletHasChildren,
} from "@/lib/wallets/hierarchy";
import { isInvestmentWallet } from "@/lib/wallets/investment-link";
import { getWalletParentId, normalizeWallets } from "@/lib/wallets/normalize";

export function getRecordedBalanceLabel(wallet: Wallet) {
  if (isInvestmentWallet(wallet)) {
    return "قيمة الاستثمار المسجّلة";
  }

  return isCreditWallet(wallet) ? "المستحق المسجّل" : "الرصيد المسجّل";
}

export function getActualBalanceLabel(wallet: Wallet) {
  if (isInvestmentWallet(wallet)) {
    return "قيمة الاستثمار الفعلية";
  }

  return isCreditWallet(wallet) ? "المستحق الفعلي" : "الرصيد الفعلي";
}

export function getReconcilableWallets(wallets: Wallet[]) {
  return wallets.filter(
    (wallet) => !walletHasChildren(wallet.id, wallets) && !isInvestmentWallet(wallet),
  );
}

export function buildReconciliationPreview(
  wallet: Wallet,
  transactions: Transaction[],
  actualBalance: number,
  investments: Investment[] = [],
) {
  const recordedBalance = calculateWalletBalance(wallet, transactions, investments);
  const difference = actualBalance - recordedBalance;

  return {
    recordedBalance,
    actualBalance,
    difference,
    isMatched: Math.abs(difference) < 0.005,
  };
}

export function getLatestReconciliationsByWallet(reconciliations: WalletReconciliation[]) {
  const latest = new Map<string, WalletReconciliation>();

  for (const reconciliation of reconciliations) {
    if (!latest.has(reconciliation.wallet_id)) {
      latest.set(reconciliation.wallet_id, reconciliation);
    }
  }

  return latest;
}

export function summarizePortfolioWealth(
  wallets: Wallet[],
  transactions: Transaction[],
  investments: Investment[] = [],
): ParentWalletBalanceSummary {
  const creditNotes: ParentWalletBalanceSummary["creditNotes"] = [];
  let assetTotal = 0;

  for (const wallet of normalizeWallets(wallets)) {
    const parentId = getWalletParentId(wallet);

    if (parentId && walletHasChildren(parentId, wallets)) {
      continue;
    }

    if (walletHasChildren(wallet.id, wallets)) {
      const summary = getAggregatedSubWalletSummary(wallet.id, wallets, transactions, investments);
      assetTotal += summary.assetTotal;
      creditNotes.push(...summary.creditNotes);
      continue;
    }

    if (isCreditWallet(wallet)) {
      creditNotes.push({
        walletName: wallet.name,
        owed: getCreditOwed(wallet, transactions),
        available: getCreditAvailable(wallet, transactions),
        limit: wallet.credit_limit != null ? Number(wallet.credit_limit) : null,
      });
      continue;
    }

    assetTotal += calculateWalletBalance(wallet, transactions, investments);
  }

  return { assetTotal, creditNotes };
}

export function summarizeWalletBalances(
  wallets: Wallet[],
  transactions: Transaction[],
  investments: Investment[] = [],
) {
  const rows = buildWalletDisplayRows(wallets);
  const portfolio = summarizePortfolioWealth(wallets, transactions, investments);
  const balances = rows.map(({ wallet, depth }) => ({
    wallet,
    depth,
    balance: calculateWalletBalance(wallet, transactions, investments),
    creditAvailable: getCreditAvailable(wallet, transactions),
  }));

  return {
    balances,
    totalBalance: portfolio.assetTotal,
    creditNotes: portfolio.creditNotes,
  };
}
