"use client";

import { memo } from "react";
import ReorderButton from "@/components/ui/ReorderButton";
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
  showDivider: boolean;
  wallets: Wallet[];
  transactions: Transaction[];
  investments: Investment[];
  currency: string;
  expandedParents: Set<string>;
  reorderingId: string | null;
  openDetailsLabel: string;
  onToggleExpand: (parentId: string) => void;
  onMoveWallet: (walletId: string, direction: "up" | "down") => void;
  onOpenDetails: (walletId: string) => void;
};

function getWalletRowData(
  row: WalletDisplayRow,
  wallets: Wallet[],
  transactions: Transaction[],
  investments: Investment[],
  expandedParents: Set<string>,
) {
  const { wallet, depth, siblingIndex, siblingCount, hasChildren } = row;
  const typeLabel = resolveWalletDisplayLabel(wallet);
  const aggregatedSummary = hasChildren
    ? getAggregatedSubWalletSummary(wallet.id, wallets, transactions, investments)
    : null;

  return {
    wallet,
    depth,
    siblingIndex,
    siblingCount,
    hasChildren,
    typeLabel,
    aggregatedSummary,
    isExpanded: expandedParents.has(wallet.id),
    isInvestment: isInvestmentWallet(wallet),
  };
}

const WalletListItem = memo(function WalletListItem({
  row,
  showDivider,
  wallets,
  transactions,
  investments,
  currency,
  expandedParents,
  reorderingId,
  openDetailsLabel,
  onToggleExpand,
  onMoveWallet,
  onOpenDetails,
}: WalletListItemProps) {
  const t = useTranslations();
  const data = getWalletRowData(row, wallets, transactions, investments, expandedParents);
  const {
    wallet,
    depth,
    siblingIndex,
    siblingCount,
    hasChildren,
    typeLabel,
    aggregatedSummary,
    isExpanded,
  } = data;

  return (
    <li
      className={`flex items-stretch gap-2 px-3 py-3.5 sm:gap-3 sm:px-4 sm:py-4 ${
        showDivider ? "border-t border-slate-100/80" : ""
      }`}
      style={{ paddingRight: `${depth * 0.75 + 0.75}rem` }}
    >
      {hasChildren ? (
        <button
          type="button"
          onClick={() => onToggleExpand(wallet.id)}
          aria-expanded={isExpanded}
          aria-label={
            isExpanded ? t("wallets.collapseSubWallets") : t("wallets.expandSubWallets")
          }
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <span
            className={`inline-block text-[10px] transition-transform ${
              isExpanded ? "rotate-90" : ""
            }`}
          >
            ◀
          </span>
        </button>
      ) : depth > 0 ? (
        <span className="inline-block w-9 shrink-0" aria-hidden />
      ) : null}

      <button
        type="button"
        onClick={() => onOpenDetails(wallet.id)}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-start transition hover:bg-slate-50/80"
      >
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl sm:h-10 sm:w-10 sm:text-lg"
          style={{ backgroundColor: `${wallet.color}18` }}
        >
          {wallet.icon}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {wallet.is_default ? (
              <span className="text-amber-500" title={t("wallets.defaultWallet")}>
                ⭐
              </span>
            ) : null}
            <span className="wrap-text text-base font-semibold tracking-tight text-slate-900">
              {wallet.name}
            </span>
            <WalletTypeBadge label={typeLabel} isInvestment={data.isInvestment} />
          </div>
          <p className="mt-0.5 text-xs font-normal text-slate-400">{openDetailsLabel}</p>
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-1.5 self-center sm:gap-3">
        <div className="min-w-[5.5rem] text-end sm:min-w-[6.5rem]">
          <WalletBalanceCell
            wallet={wallet}
            transactions={transactions}
            investments={investments}
            currency={currency}
            aggregatedSummary={aggregatedSummary}
            compact
          />
        </div>

        <div className="flex flex-col gap-0.5">
          <ReorderButton
            direction="up"
            disabled={siblingIndex === 0 || reorderingId === wallet.id}
            onClick={() => onMoveWallet(wallet.id, "up")}
          />
          <ReorderButton
            direction="down"
            disabled={siblingIndex === siblingCount - 1 || reorderingId === wallet.id}
            onClick={() => onMoveWallet(wallet.id, "down")}
          />
        </div>
      </div>
    </li>
  );
});

export default WalletListItem;
