"use client";

import { memo } from "react";
import WalletBalanceCell from "@/components/wallets/WalletBalanceCell";
import WalletTypeBadge from "@/components/wallets/WalletTypeBadge";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { Investment, Transaction, Wallet } from "@/lib/types/database";
import type { WalletDisplayRow } from "@/lib/wallets/hierarchy";
import {
  getAggregatedSubWalletSummary,
  isInvestmentWallet,
  resolveWalletDisplayLabel,
} from "@/lib/wallets";

export type WalletListItemProps = {
  row: WalletDisplayRow;
  wallets: Wallet[];
  transactions: Transaction[];
  investments: Investment[];
  currency: string;
  expandedParents: Set<string>;
  onToggleExpand: (parentId: string) => void;
  onOpenDetails: (walletId: string) => void;
};

function getWalletRowData(
  row: WalletDisplayRow,
  wallets: Wallet[],
  transactions: Transaction[],
  investments: Investment[],
  expandedParents: Set<string>,
) {
  const { wallet, depth, hasChildren } = row;
  const typeLabel = resolveWalletDisplayLabel(wallet);
  const aggregatedSummary = hasChildren
    ? getAggregatedSubWalletSummary(wallet.id, wallets, transactions, investments)
    : null;

  return {
    wallet,
    depth,
    hasChildren,
    typeLabel,
    aggregatedSummary,
    isExpanded: expandedParents.has(wallet.id),
    isInvestment: isInvestmentWallet(wallet),
  };
}

const WalletListItem = memo(function WalletListItem({
  row,
  wallets,
  transactions,
  investments,
  currency,
  expandedParents,
  onToggleExpand,
  onOpenDetails,
}: WalletListItemProps) {
  const t = useTranslations();
  const data = getWalletRowData(row, wallets, transactions, investments, expandedParents);
  const { wallet, depth, hasChildren, typeLabel, aggregatedSummary, isExpanded } = data;
  const isChild = depth > 0;
  const rowPad = isChild ? "py-0.5" : "py-1.5";
  const iconBox = isChild
    ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm"
    : "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base";

  return (
    <tr
      className={`cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50/90 ${
        isChild ? "bg-slate-50/50" : ""
      }`}
      onClick={() => onOpenDetails(wallet.id)}
    >
      <td className={`${rowPad} pe-2 ps-3 align-middle`}>
        <div
          className="flex min-w-0 items-center gap-1.5"
          style={{ paddingInlineStart: isChild ? `${depth * 0.85}rem` : undefined }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleExpand(wallet.id);
              }}
              aria-expanded={isExpanded}
              aria-label={
                isExpanded ? t("wallets.collapseSubWallets") : t("wallets.expandSubWallets")
              }
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <span
                className={`inline-block text-[10px] transition-transform ${
                  isExpanded ? "rotate-90" : ""
                }`}
              >
                ◀
              </span>
            </button>
          ) : isChild ? (
            <span className="inline-block w-4 shrink-0" aria-hidden />
          ) : (
            <span className="inline-block w-7 shrink-0" aria-hidden />
          )}

          <span className={iconBox} style={{ backgroundColor: `${wallet.color}18` }}>
            {wallet.icon}
          </span>

          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {wallet.is_default ? (
              <span className="text-amber-500" title={t("wallets.defaultWallet")}>
                ⭐
              </span>
            ) : null}
            <span
              className={`wrap-text tracking-tight text-slate-900 ${
                isChild ? "text-sm font-medium" : "text-sm font-semibold"
              }`}
            >
              {wallet.name}
            </span>
            <WalletTypeBadge label={typeLabel} isInvestment={data.isInvestment} />
          </div>
        </div>
      </td>
      <td className={`${rowPad} pe-3 ps-2 text-end align-middle`}>
        <WalletBalanceCell
          wallet={wallet}
          transactions={transactions}
          investments={investments}
          currency={currency}
          aggregatedSummary={aggregatedSummary}
          compact
        />
      </td>
    </tr>
  );
});

export default WalletListItem;
