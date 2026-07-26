"use client";

import Link from "next/link";
import { memo, useMemo, useState } from "react";
import IconActionButton from "@/components/ui/IconActionButton";
import ReorderButton from "@/components/ui/ReorderButton";
import WalletBalanceCell from "@/components/wallets/WalletBalanceCell";
import { walletTypeOptions } from "@/lib/constants/wallet-options";
import type { Investment, Transaction, Wallet, WalletReconciliation } from "@/lib/types/database";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { WalletDisplayRow } from "@/lib/wallets/hierarchy";
import {
  getAggregatedSubWalletSummary,
  getInvestmentsPageHref,
  getVisibleWalletTableRows,
  getWalletParentId,
  getWalletTransactionNet,
  getWalletTypeLabel,
  isInvestmentWallet,
} from "@/lib/wallets";

type WalletsTableProps = {
  rows: WalletDisplayRow[];
  wallets: Wallet[];
  transactions: Transaction[];
  investments?: Investment[];
  currency: string;
  reconcilableWalletIds: Set<string>;
  latestReconciliations: Map<string, WalletReconciliation>;
  reorderingId: string | null;
  onMoveWallet: (walletId: string, direction: "up" | "down") => void;
  onAddSubWallet: (parentWalletId: string) => void;
  onInventoryWallet: (walletId: string) => void;
  onEditWallet: (wallet: Wallet) => void;
  onDeleteWallet: (walletId: string) => void;
};

export default function WalletsTable({
  rows,
  wallets,
  transactions,
  investments = [],
  currency,
  reconcilableWalletIds,
  latestReconciliations,
  reorderingId,
  onMoveWallet,
  onAddSubWallet,
  onInventoryWallet,
  onEditWallet,
  onDeleteWallet,
}: WalletsTableProps) {
  const [expandedParents, setExpandedParents] = useState<Set<string>>(() => new Set());

  const visibleRows = useMemo(
    () => getVisibleWalletTableRows(rows, expandedParents),
    [rows, expandedParents],
  );

  function toggleParent(parentId: string) {
    setExpandedParents((current) => {
      const next = new Set(current);

      if (next.has(parentId)) {
        next.delete(parentId);
      } else {
        next.add(parentId);
      }

      return next;
    });
  }

  function handleAddSubWallet(parentWalletId: string) {
    setExpandedParents((current) => new Set(current).add(parentWalletId));
    onAddSubWallet(parentWalletId);
  }

  if (rows.length === 0) {
    return <p className="mt-4 text-sm text-slate-500">ابدأ بإضافة أول محفظة.</p>;
  }

  const rowProps = {
    wallets,
    transactions,
    investments,
    currency,
    reconcilableWalletIds,
    latestReconciliations,
    expandedParents,
    reorderingId,
    onToggleExpand: toggleParent,
    onMoveWallet,
    onAddSubWallet: handleAddSubWallet,
    onInventoryWallet,
    onEditWallet,
    onDeleteWallet,
  };

  return (
    <>
      <div className="mt-4 space-y-3 md:hidden">
        {visibleRows.map((row) => (
          <WalletMobileCard key={row.wallet.id} row={row} {...rowProps} />
        ))}
      </div>

      <div className="mt-4 hidden overflow-x-auto md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="px-3 py-3 text-right font-medium">الترتيب</th>
              <th className="px-3 py-3 text-right font-medium">المحفظة</th>
              <th className="px-3 py-3 text-right font-medium">النوع</th>
              <th className="px-3 py-3 text-right font-medium">الرصيد</th>
              <th className="px-3 py-3 text-right font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <WalletTableRow key={row.wallet.id} row={row} {...rowProps} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

type WalletRowSharedProps = {
  wallets: Wallet[];
  transactions: Transaction[];
  investments: Investment[];
  currency: string;
  reconcilableWalletIds: Set<string>;
  latestReconciliations: Map<string, WalletReconciliation>;
  expandedParents: Set<string>;
  reorderingId: string | null;
  onToggleExpand: (parentId: string) => void;
  onMoveWallet: (walletId: string, direction: "up" | "down") => void;
  onAddSubWallet: (parentWalletId: string) => void;
  onInventoryWallet: (walletId: string) => void;
  onEditWallet: (wallet: Wallet) => void;
  onDeleteWallet: (walletId: string) => void;
};

function getWalletRowData(
  row: WalletDisplayRow,
  {
    wallets,
    transactions,
    investments,
    currency,
    reconcilableWalletIds,
    latestReconciliations,
    expandedParents,
  }: Pick<
    WalletRowSharedProps,
    | "wallets"
    | "transactions"
    | "investments"
    | "currency"
    | "reconcilableWalletIds"
    | "latestReconciliations"
    | "expandedParents"
  >,
) {
  const { wallet, depth, siblingIndex, siblingCount, hasChildren } = row;
  const transactionNet = getWalletTransactionNet(wallet.id, transactions);
  const cardLabel = getWalletTypeLabel(wallet);
  const typeLabel =
    cardLabel ??
    walletTypeOptions.find((item) => item.value === wallet.wallet_type)?.label ??
    wallet.wallet_type;
  const aggregatedSummary = hasChildren
    ? getAggregatedSubWalletSummary(wallet.id, wallets, transactions, investments)
    : null;
  const isInvestment = isInvestmentWallet(wallet);
  const isReconcilable = reconcilableWalletIds.has(wallet.id);
  const lastReconciliation = latestReconciliations.get(wallet.id);
  const isExpanded = expandedParents.has(wallet.id);

  return {
    wallet,
    depth,
    siblingIndex,
    siblingCount,
    hasChildren,
    transactionNet,
    typeLabel,
    aggregatedSummary,
    isInvestment,
    isReconcilable,
    lastReconciliation,
    isExpanded,
  };
}

const WalletMobileCard = memo(function WalletMobileCard({
  row,
  ...shared
}: { row: WalletDisplayRow } & WalletRowSharedProps) {
  const data = getWalletRowData(row, shared);
  const {
    wallet,
    depth,
    siblingIndex,
    siblingCount,
    hasChildren,
    transactionNet,
    typeLabel,
    aggregatedSummary,
    isInvestment,
    isReconcilable,
    lastReconciliation,
    isExpanded,
  } = data;

  return (
    <article
      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
      style={{ marginRight: `${depth * 0.75}rem` }}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
          style={{ backgroundColor: `${wallet.color}25` }}
        >
          {wallet.icon}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="flex items-center gap-1 font-medium text-slate-900">
                {wallet.is_default ? (
                  <span className="text-amber-500" title="المحفظة الافتراضية">
                    ⭐
                  </span>
                ) : null}
                <span className="truncate">{wallet.name}</span>
              </p>
              <p className="text-xs text-slate-500">{typeLabel}</p>
            </div>

            <div className="shrink-0 text-left">
              <WalletBalanceCell
                wallet={wallet}
                transactions={shared.transactions}
                investments={shared.investments}
                currency={shared.currency}
                aggregatedSummary={aggregatedSummary}
              />
            </div>
          </div>

          {hasChildren ? (
            <button
              type="button"
              onClick={() => shared.onToggleExpand(wallet.id)}
              className="mt-2 text-xs font-medium text-emerald-700"
            >
              {isExpanded ? "إخفاء المحافظ الفرعية" : "عرض المحافظ الفرعية"}
            </button>
          ) : null}

          {!hasChildren && !isInvestment && transactionNet !== 0 ? (
            <p className="mt-1 text-xs text-slate-500">
              {formatCurrency(transactionNet, shared.currency)} من العمليات
            </p>
          ) : null}

          {isReconcilable ? (
            <p className="mt-1 text-xs text-slate-500">
              {lastReconciliation
                ? `آخر جرد: ${formatDate(lastReconciliation.reconciled_at)}`
                : "لم يُجرَ جرد بعد"}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-1">
          <ReorderButton
            direction="up"
            disabled={siblingIndex === 0 || shared.reorderingId === wallet.id}
            onClick={() => shared.onMoveWallet(wallet.id, "up")}
          />
          <ReorderButton
            direction="down"
            disabled={siblingIndex === siblingCount - 1 || shared.reorderingId === wallet.id}
            onClick={() => shared.onMoveWallet(wallet.id, "down")}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {getWalletParentId(wallet) === null && wallet.wallet_type === "bank" ? (
            <IconActionButton
              icon="➕"
              label="إضافة محفظة فرعية"
              onClick={() => shared.onAddSubWallet(wallet.id)}
              tone="emerald"
            />
          ) : null}
          <WalletRowActions
            wallet={wallet}
            isInvestment={isInvestment}
            isReconcilable={isReconcilable}
            onInventoryWallet={shared.onInventoryWallet}
            onEditWallet={shared.onEditWallet}
            onDeleteWallet={shared.onDeleteWallet}
          />
        </div>
      </div>
    </article>
  );
});

const WalletTableRow = memo(function WalletTableRow({
  row,
  ...shared
}: { row: WalletDisplayRow } & WalletRowSharedProps) {
  const data = getWalletRowData(row, shared);
  const {
    wallet,
    depth,
    siblingIndex,
    siblingCount,
    hasChildren,
    transactionNet,
    typeLabel,
    aggregatedSummary,
    isInvestment,
    isReconcilable,
    lastReconciliation,
    isExpanded,
  } = data;

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="px-3 py-4">
        <div className="flex items-center gap-1">
          <ReorderButton
            direction="up"
            disabled={siblingIndex === 0 || shared.reorderingId === wallet.id}
            onClick={() => shared.onMoveWallet(wallet.id, "up")}
          />
          <ReorderButton
            direction="down"
            disabled={siblingIndex === siblingCount - 1 || shared.reorderingId === wallet.id}
            onClick={() => shared.onMoveWallet(wallet.id, "down")}
          />
        </div>
      </td>
      <td className="px-3 py-4">
        <div
          className="flex items-center gap-3"
          style={{ paddingRight: `${depth * 1.25}rem` }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => shared.onToggleExpand(wallet.id)}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "إخفاء المحافظ الفرعية" : "عرض المحافظ الفرعية"}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
            >
              <span
                className={`inline-block text-xs transition-transform ${
                  isExpanded ? "rotate-90" : ""
                }`}
              >
                ◀
              </span>
            </button>
          ) : (
            <span className="inline-block h-8 w-8" aria-hidden />
          )}
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
            style={{ backgroundColor: `${wallet.color}25` }}
          >
            {wallet.icon}
          </span>
          <div>
            <p className="flex items-center gap-1.5 font-medium text-slate-900">
              {wallet.is_default ? (
                <span className="text-amber-500" title="المحفظة الافتراضية">
                  ⭐
                </span>
              ) : null}
              <span>{wallet.name}</span>
              {getWalletParentId(wallet) === null && wallet.wallet_type === "bank" ? (
                <IconActionButton
                  icon="➕"
                  label="إضافة محفظة فرعية"
                  onClick={() => shared.onAddSubWallet(wallet.id)}
                  tone="emerald"
                />
              ) : null}
            </p>
            {hasChildren ? (
              <p className="text-xs text-slate-500">
                {isExpanded ? "المحافظ الفرعية ظاهرة" : "المحافظ الفرعية مخفية"}
              </p>
            ) : null}
            {!hasChildren && !isInvestment && transactionNet !== 0 ? (
              <p className="text-xs text-slate-500">
                {formatCurrency(transactionNet, shared.currency)} من العمليات
              </p>
            ) : null}
            {isReconcilable ? (
              <p className="text-xs text-slate-500">
                {lastReconciliation
                  ? `آخر جرد: ${formatDate(lastReconciliation.reconciled_at)}`
                  : "لم يُجرَ جرد بعد"}
              </p>
            ) : null}
          </div>
        </div>
      </td>
      <td className="px-3 py-4 text-slate-600">{typeLabel}</td>
      <td className="px-3 py-4">
        <WalletBalanceCell
          wallet={wallet}
          transactions={shared.transactions}
          investments={shared.investments}
          currency={shared.currency}
          aggregatedSummary={aggregatedSummary}
        />
      </td>
      <td className="px-3 py-4">
        <WalletRowActions
          wallet={wallet}
          isInvestment={isInvestment}
          isReconcilable={isReconcilable}
          onInventoryWallet={shared.onInventoryWallet}
          onEditWallet={shared.onEditWallet}
          onDeleteWallet={shared.onDeleteWallet}
        />
      </td>
    </tr>
  );
});

function WalletRowActions({
  wallet,
  isInvestment,
  isReconcilable,
  onInventoryWallet,
  onEditWallet,
  onDeleteWallet,
}: {
  wallet: Wallet;
  isInvestment: boolean;
  isReconcilable: boolean;
  onInventoryWallet: (walletId: string) => void;
  onEditWallet: (wallet: Wallet) => void;
  onDeleteWallet: (walletId: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {isInvestment ? (
        <Link
          href={getInvestmentsPageHref(wallet)}
          title="صفحة الاستثمار"
          aria-label="صفحة الاستثمار"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-sm text-indigo-700 transition hover:bg-indigo-100"
        >
          📈
        </Link>
      ) : null}
      {isReconcilable ? (
        <IconActionButton
          icon="📋"
          label="جرد"
          onClick={() => onInventoryWallet(wallet.id)}
          tone="amber"
        />
      ) : null}
      <IconActionButton icon="✏️" label="تعديل" onClick={() => onEditWallet(wallet)} tone="slate" />
      <IconActionButton
        icon="🗑️"
        label="حذف"
        onClick={() => onDeleteWallet(wallet.id)}
        tone="red"
      />
    </div>
  );
}
