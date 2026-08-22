"use client";

import { useMemo, useState } from "react";
import ModalShell from "@/components/ui/ModalShell";
import CollapsibleSection from "@/components/ui/CollapsibleSection";
import ModalEntityHeader from "@/components/ui/ModalEntityHeader";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import WalletBalanceCell from "@/components/wallets/WalletBalanceCell";
import WalletDetailActions from "@/components/wallets/WalletDetailActions";
import WalletMonthTransactionsSection from "@/components/wallets/WalletMonthTransactionsSection";
import WalletSubWalletsList from "@/components/wallets/WalletSubWalletsList";
import { useFormat } from "@/hooks/useFormat";
import type { Investment, Transaction, Wallet, WalletReconciliation } from "@/lib/types/database";
import {
  getAggregatedSubWalletSummary,
  getDirectChildWallets,
  getWalletParentId,
  getWalletTransactionNet,
  getWalletMonthlyTransactions,
  isInvestmentWallet,
  resolveWalletDisplayLabel,
} from "@/lib/wallets";

type WalletDetailModalProps = {
  wallet: Wallet;
  wallets: Wallet[];
  transactions: Transaction[];
  monthTransactions: Transaction[];
  monthLabel: string;
  monthStartDay: number;
  investments: Investment[];
  currency: string;
  hasChildren: boolean;
  isReconcilable: boolean;
  lastReconciliation?: WalletReconciliation;
  onClose: () => void;
  onAddSubWallet: (parentWalletId: string) => void;
  onInventoryWallet: (walletId: string) => void;
  onEditWallet: (wallet: Wallet) => void;
  onDeleteWallet: (walletId: string) => void;
};

export default function WalletDetailModal({
  wallet,
  wallets,
  transactions,
  monthTransactions,
  monthLabel,
  monthStartDay,
  investments,
  currency,
  hasChildren,
  isReconcilable,
  lastReconciliation,
  onClose,
  onAddSubWallet,
  onInventoryWallet,
  onEditWallet,
  onDeleteWallet,
}: WalletDetailModalProps) {
  const t = useTranslations();
  const { formatCurrency, formatDate } = useFormat();
  const [showSubWallets, setShowSubWallets] = useState(false);
  const [showMonthTransactions, setShowMonthTransactions] = useState(false);

  const isInvestment = isInvestmentWallet(wallet);
  const typeLabel = resolveWalletDisplayLabel(wallet);
  const aggregatedSummary = hasChildren
    ? getAggregatedSubWalletSummary(wallet.id, wallets, transactions, investments)
    : null;
  const transactionNet = getWalletTransactionNet(wallet.id, transactions);
  const canAddSubWallet = getWalletParentId(wallet) === null && wallet.wallet_type === "bank";
  const childWallets = useMemo(
    () => getDirectChildWallets(wallet.id, wallets),
    [wallet.id, wallets],
  );
  const recentTransactions = useMemo(
    () =>
      getWalletMonthlyTransactions(wallet.id, wallets, monthTransactions, {
        includeDescendants: hasChildren,
        monthStartDay,
      }),
    [wallet.id, wallets, monthTransactions, hasChildren, monthStartDay],
  );

  function runAndClose(action: () => void) {
    onClose();
    action();
  }

  return (
    <ModalShell onClose={onClose} maxWidthClassName="sm:max-w-lg">
      <ModalEntityHeader
        icon={wallet.icon}
        color={wallet.color}
        title={
          <span className="flex flex-wrap items-center gap-1.5">
            {wallet.is_default ? (
              <span className="text-amber-500" title={t("wallets.defaultWallet")}>
                ⭐
              </span>
            ) : null}
            {wallet.name}
          </span>
        }
        subtitle={typeLabel}
        onClose={onClose}
      />

      <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
        <p className="text-xs font-medium text-slate-500">{t("wallets.balanceLabel")}</p>
        <div className="mt-2">
          <WalletBalanceCell
            wallet={wallet}
            transactions={transactions}
            investments={investments}
            currency={currency}
            aggregatedSummary={aggregatedSummary}
          />
        </div>
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        {!hasChildren && !isInvestment && transactionNet !== 0 ? (
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <dt className="text-slate-500">{t("wallets.fromTransactions")}</dt>
            <dd className="font-medium text-slate-800">
              {formatCurrency(transactionNet, currency)}
            </dd>
          </div>
        ) : null}

        {isReconcilable ? (
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <dt className="text-slate-500">{t("wallets.lastBalanceUpdate")}</dt>
            <dd className="text-end font-medium text-slate-800">
              {lastReconciliation
                ? formatDate(lastReconciliation.reconciled_at)
                : t("wallets.neverUpdated")}
            </dd>
          </div>
        ) : null}
      </dl>

      {hasChildren ? (
        <CollapsibleSection
          title={t("wallets.subWalletsTitle")}
          count={childWallets.length}
          open={showSubWallets}
          onToggle={() => setShowSubWallets((current) => !current)}
        >
          <WalletSubWalletsList
            childWallets={childWallets}
            transactions={transactions}
            investments={investments}
            currency={currency}
          />
        </CollapsibleSection>
      ) : null}

      <CollapsibleSection
        title={t("wallets.monthTransactionsTitle")}
        subtitle={monthLabel}
        count={recentTransactions.length}
        open={showMonthTransactions}
        onToggle={() => setShowMonthTransactions((current) => !current)}
      >
        <WalletMonthTransactionsSection
          transactions={recentTransactions}
          currency={currency}
          hasChildren={hasChildren}
        />
      </CollapsibleSection>

      <WalletDetailActions
        wallet={wallet}
        canAddSubWallet={canAddSubWallet}
        isReconcilable={isReconcilable}
        onAddSubWallet={() => runAndClose(() => onAddSubWallet(wallet.id))}
        onInventoryWallet={() => runAndClose(() => onInventoryWallet(wallet.id))}
        onEditWallet={() => runAndClose(() => onEditWallet(wallet))}
        onDeleteWallet={() => runAndClose(() => onDeleteWallet(wallet.id))}
      />
    </ModalShell>
  );
}
