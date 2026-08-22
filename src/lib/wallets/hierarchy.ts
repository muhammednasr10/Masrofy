import type { Investment, Transaction, Wallet } from "@/lib/types/database";
import {
  calculateWalletBalance,
  getCreditAvailable,
  getCreditOwed,
  isCreditWallet,
} from "@/lib/wallets/balance";
import { isInvestmentWallet } from "@/lib/wallets/investment-link";
import { getWalletParentId, normalizeWallets } from "@/lib/wallets/normalize";

export type WalletBalanceSortContext = {
  transactions: Transaction[];
  investments: Investment[];
};

function getWalletDisplayBalance(
  wallet: Wallet,
  wallets: Wallet[],
  sortContext: WalletBalanceSortContext,
): number {
  if (walletHasChildren(wallet.id, wallets)) {
    return getAggregatedSubWalletSummary(
      wallet.id,
      wallets,
      sortContext.transactions,
      sortContext.investments,
    ).assetTotal;
  }

  return calculateWalletBalance(
    wallet,
    sortContext.transactions,
    sortContext.investments,
  );
}

function compareWalletsForDisplay(
  a: Wallet,
  b: Wallet,
  wallets: Wallet[],
  sortContext: WalletBalanceSortContext,
): number {
  const aInvestment = isInvestmentWallet(a);
  const bInvestment = isInvestmentWallet(b);

  if (aInvestment !== bInvestment) {
    return aInvestment ? 1 : -1;
  }

  const balanceDiff =
    getWalletDisplayBalance(b, wallets, sortContext) -
    getWalletDisplayBalance(a, wallets, sortContext);

  if (balanceDiff !== 0) {
    return balanceDiff;
  }

  return a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ar");
}

export function isSubWallet(wallet: Pick<Wallet, "parent_wallet_id">): boolean {
  return getWalletParentId(wallet) !== null;
}

export function buildWalletDisplayRows(
  wallets: Wallet[],
  sortContext?: WalletBalanceSortContext,
) {
  const byParent = new Map<string | null, Wallet[]>();

  for (const wallet of normalizeWallets(wallets)) {
    const key = getWalletParentId(wallet);
    const siblings = byParent.get(key);

    if (siblings) {
      siblings.push(wallet);
    } else {
      byParent.set(key, [wallet]);
    }
  }

  for (const siblings of byParent.values()) {
    if (sortContext) {
      siblings.sort((a, b) => compareWalletsForDisplay(a, b, wallets, sortContext));
    } else {
      siblings.sort((a, b) => a.sort_order - b.sort_order);
    }
  }

  const rows: Array<{ wallet: Wallet; depth: number }> = [];
  const seen = new Set<string>();

  function walk(parentId: string | null, depth: number) {
    for (const wallet of byParent.get(parentId) ?? []) {
      if (seen.has(wallet.id)) {
        continue;
      }

      seen.add(wallet.id);
      rows.push({ wallet, depth });
      walk(wallet.id, depth + 1);
    }
  }

  walk(null, 0);

  for (const wallet of normalizeWallets(wallets)) {
    if (seen.has(wallet.id)) {
      continue;
    }

    seen.add(wallet.id);
    rows.push({ wallet, depth: 0 });
    walk(wallet.id, 1);
  }

  return rows;
}

export function getParentWallets(wallets: Wallet[]) {
  return normalizeWallets(wallets).filter((wallet) => getWalletParentId(wallet) === null);
}

export function walletHasChildren(walletId: string, wallets: Wallet[]) {
  return normalizeWallets(wallets).some(
    (wallet) => getWalletParentId(wallet) === walletId,
  );
}

export function getWalletTypeLabel(wallet: Wallet) {
  if (wallet.card_kind === "debit") {
    return "بطاقة خصم";
  }

  if (wallet.card_kind === "credit") {
    return "بطاقة ائتمان";
  }

  return null;
}

export type ParentWalletBalanceSummary = {
  assetTotal: number;
  creditNotes: Array<{
    walletName: string;
    owed: number;
    available: number | null;
    limit: number | null;
  }>;
};

export function getAggregatedSubWalletSummary(
  parentId: string,
  wallets: Wallet[],
  transactions: Transaction[],
  investments: Investment[] = [],
): ParentWalletBalanceSummary {
  const creditNotes: ParentWalletBalanceSummary["creditNotes"] = [];
  let assetTotal = 0;

  for (const child of getDirectChildWallets(parentId, wallets)) {
    if (isCreditWallet(child)) {
      creditNotes.push({
        walletName: child.name,
        owed: getCreditOwed(child, transactions),
        available: getCreditAvailable(child, transactions),
        limit: child.credit_limit != null ? Number(child.credit_limit) : null,
      });
      continue;
    }

    assetTotal += calculateWalletBalance(child, transactions, investments);
  }

  return { assetTotal, creditNotes };
}

export type WalletDisplayRow = {
  wallet: Wallet;
  depth: number;
  siblingIndex: number;
  siblingCount: number;
  hasChildren: boolean;
};

export function buildWalletTableRows(
  wallets: Wallet[],
  sortContext?: WalletBalanceSortContext,
): WalletDisplayRow[] {
  const displayRows = buildWalletDisplayRows(wallets, sortContext);
  const siblingsByParent = new Map<string | null, typeof displayRows>();

  for (const row of displayRows) {
    const parentId = getWalletParentId(row.wallet);
    const siblings = siblingsByParent.get(parentId) ?? [];
    siblings.push(row);
    siblingsByParent.set(parentId, siblings);
  }

  return displayRows.map((row) => {
    const parentId = getWalletParentId(row.wallet);
    const siblings = siblingsByParent.get(parentId) ?? [row];

    return {
      ...row,
      siblingIndex: siblings.findIndex((item) => item.wallet.id === row.wallet.id),
      siblingCount: siblings.length,
      hasChildren: walletHasChildren(row.wallet.id, wallets),
    };
  });
}

export function getVisibleWalletTableRows(
  rows: WalletDisplayRow[],
  expandedParentIds: Set<string>,
) {
  return rows.filter((row) => {
    const parentId = getWalletParentId(row.wallet);

    if (parentId === null) {
      return true;
    }

    return expandedParentIds.has(parentId);
  });
}

export function getDirectChildWallets(parentId: string, wallets: Wallet[]) {
  return normalizeWallets(wallets).filter(
    (wallet) => getWalletParentId(wallet) === parentId,
  );
}

export function getWalletDescendantIds(walletId: string, wallets: Wallet[]) {
  const ids: string[] = [];

  function walk(parentId: string) {
    for (const child of getDirectChildWallets(parentId, wallets)) {
      ids.push(child.id);
      walk(child.id);
    }
  }

  walk(walletId);
  return ids;
}

export type WalletSelectGroup = {
  parent: Wallet;
  children: Wallet[];
};

export function buildWalletSelectGroups(wallets: Wallet[]): WalletSelectGroup[] {
  return getParentWallets(wallets).map((parent) => ({
    parent,
    children: getDirectChildWallets(parent.id, wallets),
  }));
}

export function getWalletSelectGroupLabel(wallet: Wallet) {
  return `${wallet.icon} ${wallet.name}`;
}

export function getWalletSelectOptionLabel(
  wallet: Wallet,
  role: "standalone" | "parent" | "child" = "standalone",
) {
  const typeLabel = getWalletTypeLabel(wallet);
  const base = `${wallet.icon} ${wallet.name}`;

  if (role === "parent") {
    return `${base} — رئيسية`;
  }

  if (role === "child") {
    return typeLabel ? `↳ ${base} — ${typeLabel}` : `↳ ${base}`;
  }

  return typeLabel ? `${base} — ${typeLabel}` : base;
}
