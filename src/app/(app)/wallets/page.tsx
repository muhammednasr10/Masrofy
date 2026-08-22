"use client";

import InternalTransfersList from "@/components/wallets/InternalTransfersList";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import WalletReconciliationHistory from "@/components/wallets/WalletReconciliationHistory";
import WalletsPageModals from "@/components/wallets/WalletsPageModals";
import WalletsSummaryCard from "@/components/wallets/WalletsSummaryCard";
import WalletsTable from "@/components/wallets/WalletsTable";
import WalletsToolbar from "@/components/wallets/WalletsToolbar";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useWalletsPage } from "@/hooks/useWalletsPage";

export default function WalletsPage() {
  const t = useTranslations();
  const page = useWalletsPage();

  if (page.loading) {
    return <p className="text-sm text-slate-500">{t("wallets.loading")}</p>;
  }

  return (
    <div className="space-y-6">
      <WalletsSummaryCard summary={page.portfolioSummary} currency={page.currency} />
      <FeedbackBanner error={page.error} message={page.message} />

      <WalletsToolbar
        wallets={page.wallets}
        defaultWalletId={page.defaultWalletId}
        hasReconcilableWallets={page.reconcilableWalletIds.size > 0}
        canTransfer={page.transferableWallets.length >= 2}
        onSetDefault={page.handleSetDefault}
        onOpenInventory={() => page.openInventoryModal()}
        onOpenTransfer={page.openTransferModal}
        onOpenAdd={() => page.openAddModal()}
      />

      <section className="rounded-3xl border border-white bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-slate-900">{t("wallets.sectionTitle")}</h2>
        <p className="mt-1 text-sm text-slate-500">{t("wallets.sectionDesc")}</p>
        <WalletsTable
          rows={page.tableRows}
          wallets={page.wallets}
          transactions={page.transactions}
          monthTransactions={page.monthTransactions}
          monthStartDay={page.monthStartDay}
          investments={page.investments}
          currency={page.currency}
          reconcilableWalletIds={page.reconcilableWalletIds}
          latestReconciliations={page.latestReconciliations}
          reorderingId={page.reorderingId}
          onMoveWallet={page.handleMoveWallet}
          onAddSubWallet={page.openAddModal}
          onInventoryWallet={page.openInventoryModal}
          onEditWallet={page.openEditModal}
          onDeleteWallet={page.handleDelete}
        />
      </section>

      <InternalTransfersList
        transfers={page.internalTransfers}
        wallets={page.wallets}
        currency={page.currency}
      />

      <section className="rounded-3xl border border-white bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-slate-900">{t("wallets.reconciliationTitle")}</h2>
        <p className="mt-1 text-sm text-slate-500">{t("wallets.reconciliationDesc")}</p>
        <WalletReconciliationHistory
          reconciliations={page.reconciliations}
          currency={page.currency}
        />
      </section>

      <WalletsPageModals
        currency={page.currency}
        wallets={page.wallets}
        transactions={page.transactions}
        investments={page.investments}
        parentWallets={page.parentWallets}
        takenInvestmentIds={page.takenInvestmentIds}
        transferableWallets={page.transferableWallets}
        addForm={page.addForm}
        editForm={page.editForm}
        editingWalletId={page.editingWalletId}
        transferForm={page.transferForm}
        showAddModal={page.showAddModal}
        showEditModal={Boolean(page.editingWalletId && page.editForm)}
        showInventoryModal={page.showInventoryModal}
        showTransferModal={page.showTransferModal}
        inventoryFocusWalletId={page.inventoryFocusWalletId}
        adding={page.adding}
        savingEdit={page.savingEdit}
        transferring={page.transferring}
        setAddForm={page.setAddForm}
        setEditForm={page.setEditForm}
        setTransferForm={page.setTransferForm}
        onCloseAdd={page.closeAddModal}
        onCloseEdit={page.closeEditModal}
        onCloseInventory={page.closeInventoryModal}
        onCloseTransfer={page.closeTransferModal}
        onAddSubmit={page.handleAddSubmit}
        onEditSubmit={page.handleEditSubmit}
        onTransferSubmit={page.handleTransferSubmit}
        onInventoryComplete={page.loadData}
      />
    </div>
  );
}
