"use client";

import { useMemo, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import WalletDetailModal from "@/components/wallets/WalletDetailModal";
import WalletListItem from "@/components/wallets/WalletListItem";
import { useFormat } from "@/hooks/useFormat";
import type { Investment, Transaction, Wallet, WalletReconciliation } from "@/lib/types/database";
import type { WalletDisplayRow } from "@/lib/wallets/hierarchy";
import { getVisibleWalletTableRows } from "@/lib/wallets";

type WalletsTableProps = {
  rows: WalletDisplayRow[];
  wallets: Wallet[];
  transactions: Transaction[];
  monthTransactions: Transaction[];
  monthStartDay: number;
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
  monthTransactions,
  monthStartDay,
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
  const t = useTranslations();
  const { getMonthRange } = useFormat();
  const monthLabel = getMonthRange(new Date(), monthStartDay).label;
  const [expandedParents, setExpandedParents] = useState<Set<string>>(() => new Set());
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);

  const visibleRows = useMemo(
    () => getVisibleWalletTableRows(rows, expandedParents),
    [rows, expandedParents],
  );

  const selectedRow = useMemo(
    () => (selectedWalletId ? rows.find((row) => row.wallet.id === selectedWalletId) : undefined),
    [rows, selectedWalletId],
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
    return <EmptyState message={t("wallets.empty")} className="mt-6 py-8" />;
  }

  return (
    <>
      <ul className="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white">
        {visibleRows.map((row, index) => (
          <WalletListItem
            key={row.wallet.id}
            row={row}
            showDivider={index > 0}
            wallets={wallets}
            transactions={transactions}
            investments={investments}
            currency={currency}
            expandedParents={expandedParents}
            reorderingId={reorderingId}
            openDetailsLabel={t("wallets.openDetails")}
            onToggleExpand={toggleParent}
            onMoveWallet={onMoveWallet}
            onOpenDetails={setSelectedWalletId}
          />
        ))}
      </ul>

      {selectedRow ? (
        <WalletDetailModal
          wallet={selectedRow.wallet}
          wallets={wallets}
          transactions={transactions}
          monthTransactions={monthTransactions}
          monthLabel={monthLabel}
          monthStartDay={monthStartDay}
          investments={investments}
          currency={currency}
          hasChildren={selectedRow.hasChildren}
          isReconcilable={reconcilableWalletIds.has(selectedRow.wallet.id)}
          lastReconciliation={latestReconciliations.get(selectedRow.wallet.id)}
          onClose={() => setSelectedWalletId(null)}
          onAddSubWallet={handleAddSubWallet}
          onInventoryWallet={onInventoryWallet}
          onEditWallet={onEditWallet}
          onDeleteWallet={onDeleteWallet}
        />
      ) : null}
    </>
  );
}
