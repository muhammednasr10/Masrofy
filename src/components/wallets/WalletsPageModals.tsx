"use client";

import type { FormEvent } from "react";
import WalletFormFields from "@/components/wallets/WalletFormFields";
import WalletFormModal from "@/components/wallets/WalletFormModal";
import WalletInventoryModal from "@/components/wallets/WalletInventoryModal";
import WalletTransferModal from "@/components/wallets/WalletTransferModal";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { Investment, Transaction, Wallet } from "@/lib/types/database";
import type { WalletFormState } from "@/lib/wallets";
import type { WalletTransferFormState } from "@/lib/wallets/transfer";

type WalletsPageModalsProps = {
  currency: string;
  wallets: Wallet[];
  transactions: Transaction[];
  investments: Investment[];
  parentWallets: Wallet[];
  takenInvestmentIds: Set<string>;
  transferableWallets: Wallet[];
  addForm: WalletFormState;
  editForm: WalletFormState | null;
  editingWalletId: string | null;
  transferForm: WalletTransferFormState;
  showAddModal: boolean;
  showEditModal: boolean;
  showInventoryModal: boolean;
  showTransferModal: boolean;
  inventoryFocusWalletId: string | null;
  adding: boolean;
  savingEdit: boolean;
  transferring: boolean;
  setAddForm: (form: WalletFormState) => void;
  setEditForm: (form: WalletFormState) => void;
  setTransferForm: (form: WalletTransferFormState) => void;
  onCloseAdd: () => void;
  onCloseEdit: () => void;
  onCloseInventory: () => void;
  onCloseTransfer: () => void;
  onAddSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEditSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTransferSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onInventoryComplete: () => Promise<void>;
};

export default function WalletsPageModals({
  currency,
  wallets,
  transactions,
  investments,
  parentWallets,
  takenInvestmentIds,
  transferableWallets,
  addForm,
  editForm,
  editingWalletId,
  transferForm,
  showAddModal,
  showEditModal,
  showInventoryModal,
  showTransferModal,
  inventoryFocusWalletId,
  adding,
  savingEdit,
  transferring,
  setAddForm,
  setEditForm,
  setTransferForm,
  onCloseAdd,
  onCloseEdit,
  onCloseInventory,
  onCloseTransfer,
  onAddSubmit,
  onEditSubmit,
  onTransferSubmit,
  onInventoryComplete,
}: WalletsPageModalsProps) {
  const t = useTranslations();

  return (
    <>
      {showTransferModal ? (
        <WalletTransferModal
          wallets={transferableWallets}
          form={transferForm}
          submitting={transferring}
          onChange={setTransferForm}
          onSubmit={onTransferSubmit}
          onClose={onCloseTransfer}
        />
      ) : null}

      {showInventoryModal ? (
        <WalletInventoryModal
          key={inventoryFocusWalletId ?? "all"}
          wallets={wallets}
          transactions={transactions}
          currency={currency}
          focusWalletId={inventoryFocusWalletId}
          onClose={onCloseInventory}
          onComplete={onInventoryComplete}
        />
      ) : null}

      {showAddModal ? (
        <WalletFormModal
          title={addForm.parentWalletId ? t("wallets.addSubWallet") : t("wallets.addWalletTitle")}
          description={
            addForm.parentWalletId
              ? t("wallets.addSubWalletDesc")
              : t("wallets.addWalletDesc")
          }
          onClose={onCloseAdd}
        >
          <form onSubmit={onAddSubmit} className="mt-6 space-y-4">
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
                {adding ? t("wallets.saving") : t("wallets.submitAdd")}
              </button>
              <button
                type="button"
                onClick={onCloseAdd}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        </WalletFormModal>
      ) : null}

      {showEditModal && editForm && editingWalletId ? (
        <WalletFormModal
          title={t("wallets.editWalletTitle")}
          description={t("wallets.editWalletDesc")}
          onClose={onCloseEdit}
        >
          <form onSubmit={onEditSubmit} className="mt-6 space-y-4">
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
                {savingEdit ? t("wallets.saving") : t("wallets.submitEdit")}
              </button>
              <button
                type="button"
                onClick={onCloseEdit}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        </WalletFormModal>
      ) : null}
    </>
  );
}
