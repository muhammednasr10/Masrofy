"use client";

import dynamic from "next/dynamic";
import InternalTransfersList from "@/components/wallets/InternalTransfersList";
import WalletTransferModal from "@/components/wallets/WalletTransferModal";
import { FeedbackBanner } from "@/components/wallets/FeedbackBanner";
import WalletFormFields from "@/components/wallets/WalletFormFields";
import WalletFormModal from "@/components/wallets/WalletFormModal";
import WalletReconciliationHistory from "@/components/wallets/WalletReconciliationHistory";
import WalletsSummaryCard from "@/components/wallets/WalletsSummaryCard";
import WalletsTable from "@/components/wallets/WalletsTable";
import WalletsToolbar from "@/components/wallets/WalletsToolbar";
import { useWalletsPage } from "@/hooks/useWalletsPage";

const WalletInventoryModal = dynamic(
  () => import("@/components/wallets/WalletInventoryModal"),
  { ssr: false },
);

export default function WalletsPage() {
  const {
    loading,
    currency,
    wallets,
    investments,
    transactions,
    reconciliations,
    internalTransfers,
    transferableWallets,
    walletRows,
    tableRows,
    parentWallets,
    takenInvestmentIds,
    reconcilableWalletIds,
    latestReconciliations,
    portfolioSummary,
    defaultWalletId,
    addForm,
    editForm,
    editingWalletId,
    showAddModal,
    showInventoryModal,
    showTransferModal,
    transferForm,
    inventoryFocusWalletId,
    adding,
    savingEdit,
    transferring,
    reorderingId,
    error,
    message,
    setAddForm,
    setEditForm,
    setTransferForm,
    loadData,
    openInventoryModal,
    closeInventoryModal,
    openTransferModal,
    closeTransferModal,
    openEditModal,
    closeEditModal,
    openAddModal,
    closeAddModal,
    handleAddSubmit,
    handleEditSubmit,
    handleMoveWallet,
    handleSetDefault,
    handleTransferSubmit,
    handleDelete,
  } = useWalletsPage();

  if (loading) {
    return <p className="text-sm text-slate-500">جاري تحميل المحافظ...</p>;
  }

  return (
    <div className="space-y-6">
      <WalletsSummaryCard summary={portfolioSummary} currency={currency} />
      <FeedbackBanner error={error} message={message} />

      <WalletsToolbar
        wallets={wallets}
        defaultWalletId={defaultWalletId}
        hasReconcilableWallets={reconcilableWalletIds.size > 0}
        canTransfer={transferableWallets.length >= 2}
        onSetDefault={handleSetDefault}
        onOpenInventory={() => openInventoryModal()}
        onOpenTransfer={openTransferModal}
        onOpenAdd={() => openAddModal()}
      />

      <section className="rounded-3xl border border-white bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-slate-900">محافظك</h2>
        <p className="mt-1 text-sm text-slate-500">
          أضف محافظ فرعية تحت البنك (Debit / Credit). المصروف على الكريديت يزيد المستحق، والدفع
          (دخل) يقلله.
        </p>
        <WalletsTable
          rows={tableRows}
          wallets={wallets}
          transactions={transactions}
          investments={investments}
          currency={currency}
          reconcilableWalletIds={reconcilableWalletIds}
          latestReconciliations={latestReconciliations}
          reorderingId={reorderingId}
          onMoveWallet={handleMoveWallet}
          onAddSubWallet={openAddModal}
          onInventoryWallet={openInventoryModal}
          onEditWallet={openEditModal}
          onDeleteWallet={handleDelete}
        />
      </section>

      <InternalTransfersList
        transfers={internalTransfers}
        wallets={wallets}
        currency={currency}
      />

      <section className="rounded-3xl border border-white bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-slate-900">سجل تحديث الأرصدة</h2>
        <p className="mt-1 text-sm text-slate-500">
          تاريخ تحديث الأرصدة ومقارنتها بالواقع، مع معاملات الإيراد/المصروف غير المعروف.
        </p>
        <WalletReconciliationHistory reconciliations={reconciliations} currency={currency} />
      </section>

      {showTransferModal ? (
        <WalletTransferModal
          wallets={transferableWallets}
          form={transferForm}
          submitting={transferring}
          onChange={setTransferForm}
          onSubmit={handleTransferSubmit}
          onClose={closeTransferModal}
        />
      ) : null}

      {showInventoryModal ? (
        <WalletInventoryModal
          key={inventoryFocusWalletId ?? "all"}
          wallets={wallets}
          transactions={transactions}
          currency={currency}
          focusWalletId={inventoryFocusWalletId}
          onClose={closeInventoryModal}
          onComplete={loadData}
        />
      ) : null}

      {showAddModal ? (
        <WalletFormModal
          title={addForm.parentWalletId ? "إضافة محفظة فرعية" : "إضافة محفظة"}
          description={
            addForm.parentWalletId
              ? "أضف بطاقة Debit أو Credit تحت المحفظة الرئيسية."
              : "أضف محفظة جديدة برصيدها الحالي."
          }
          onClose={closeAddModal}
        >
          <form onSubmit={handleAddSubmit} className="mt-6 space-y-4">
            <WalletFormFields
              form={addForm}
              onChange={setAddForm}
              idPrefix="add"
              parentWallets={parentWallets}
              investments={investments.filter(
                (investment) => !takenInvestmentIds.has(investment.id),
              )}
              currency={currency}
              allowParentSelection
            />
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={adding}
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {adding ? "جاري الحفظ..." : "إضافة المحفظة"}
              </button>
              <button
                type="button"
                onClick={closeAddModal}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                إلغاء
              </button>
            </div>
          </form>
        </WalletFormModal>
      ) : null}

      {editingWalletId && editForm ? (
        <WalletFormModal
          title="تعديل المحفظة"
          description="كارت تعديل منفصل عن الإضافة."
          onClose={closeEditModal}
        >
          <form onSubmit={handleEditSubmit} className="mt-6 space-y-4">
            <WalletFormFields
              form={editForm}
              onChange={setEditForm}
              idPrefix="edit"
              parentWallets={parentWallets}
              investments={investments.filter(
                (investment) =>
                  investment.id === editForm.investmentId ||
                  !takenInvestmentIds.has(investment.id),
              )}
              currency={currency}
              editingWalletId={editingWalletId}
            />
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={savingEdit}
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {savingEdit ? "جاري الحفظ..." : "حفظ التعديلات"}
              </button>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                إلغاء
              </button>
            </div>
          </form>
        </WalletFormModal>
      ) : null}
    </div>
  );
}
