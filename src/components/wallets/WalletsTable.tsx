"use client";

import { useMemo, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import WalletDetailModal from "@/components/wallets/WalletDetailModal";
import WalletListItem from "@/components/wallets/WalletListItem";
import { useSelectedMonth } from "@/components/month/SelectedMonthProvider";
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
  onAddSubWallet,
  onInventoryWallet,
  onEditWallet,
  onDeleteWallet,
}: WalletsTableProps) {
  const t = useTranslations();
  const { month, referenceDate } = useSelectedMonth();
  const monthLabel = month.label;
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
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-slate-500">
              <th className="px-3 py-2 text-start font-medium">{t("wallets.walletColumn")}</th>
              <th className="w-32 px-3 py-2 text-end font-medium sm:w-40">
                {t("wallets.balanceLabel")}
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <WalletListItem
                key={row.wallet.id}
                row={row}
                wallets={wallets}
                transactions={transactions}
                investments={investments}
                currency={currency}
                expandedParents={expandedParents}
                onToggleExpand={toggleParent}
                onOpenDetails={setSelectedWalletId}
              />
            ))}
          </tbody>
        </table>
      </div>

      {selectedRow ? (
        <WalletDetailModal
          wallet={selectedRow.wallet}
          wallets={wallets}
          transactions={transactions}
          monthTransactions={monthTransactions}
          monthLabel={monthLabel}
          monthStartDay={monthStartDay}
          referenceDate={referenceDate}
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
