"use client";

import type { FormEvent } from "react";
import InvestmentFormFields from "@/components/investments/InvestmentFormFields";
import InvestmentProfitModal from "@/components/investments/InvestmentProfitModal";
import InvestmentValueHistoryModal from "@/components/investments/InvestmentValueHistoryModal";
import InvestmentValueModal from "@/components/investments/InvestmentValueModal";
import WalletFormModal from "@/components/wallets/WalletFormModal";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import type { Investment, InvestmentProfitEntry, InvestmentUpdate } from "@/lib/types/database";
import type { InvestmentFormState } from "@/components/investments/InvestmentFormFields";
import type { InvestmentProfitFormState } from "@/components/investments/InvestmentProfitModal";
import type { InvestmentValueFormState } from "@/components/investments/InvestmentValueModal";

type InvestmentsPageModalsProps = {
  currency: string;
  addForm: InvestmentFormState;
  editForm: InvestmentFormState | null;
  profitForm: InvestmentProfitFormState;
  valueForm: InvestmentValueFormState | null;
  profitInvestment: Investment | null;
  valueInvestment: Investment | null;
  historyInvestment: Investment | null;
  historyUpdates: InvestmentUpdate[];
  profitEntries: InvestmentProfitEntry[];
  editingInvestmentId: string | null;
  profitInvestmentId: string | null;
  valueInvestmentId: string | null;
  historyInvestmentId: string | null;
  showAddModal: boolean;
  adding: boolean;
  savingEdit: boolean;
  savingProfit: boolean;
  savingValue: boolean;
  setAddForm: (form: InvestmentFormState) => void;
  setEditForm: (form: InvestmentFormState) => void;
  setProfitForm: (form: InvestmentProfitFormState) => void;
  setValueForm: (form: InvestmentValueFormState) => void;
  onCloseAdd: () => void;
  onCloseEdit: () => void;
  onCloseProfit: () => void;
  onCloseValue: () => void;
  onCloseHistory: () => void;
  onAddSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onEditSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onProfitSubmit: () => void;
  onValueSubmit: () => void;
  onDeleteProfitEntry: (entryId: string) => void;
};

export default function InvestmentsPageModals({
  currency,
  addForm,
  editForm,
  profitForm,
  valueForm,
  profitInvestment,
  valueInvestment,
  historyInvestment,
  historyUpdates,
  profitEntries,
  editingInvestmentId,
  profitInvestmentId,
  valueInvestmentId,
  historyInvestmentId,
  showAddModal,
  adding,
  savingEdit,
  savingProfit,
  savingValue,
  setAddForm,
  setEditForm,
  setProfitForm,
  setValueForm,
  onCloseAdd,
  onCloseEdit,
  onCloseProfit,
  onCloseValue,
  onCloseHistory,
  onAddSubmit,
  onEditSubmit,
  onProfitSubmit,
  onValueSubmit,
  onDeleteProfitEntry,
}: InvestmentsPageModalsProps) {
  const t = useTranslations();

  return (
    <>
      {showAddModal ? (
        <WalletFormModal
          title={t("investments.addTitle")}
          description={
            addForm.isFixedReturn
              ? t("investments.addDescFixed")
              : t("investments.addDescVariable")
          }
          onClose={onCloseAdd}
        >
          <form onSubmit={onAddSubmit} className="mt-6 space-y-4">
            <InvestmentFormFields form={addForm} onChange={setAddForm} idPrefix="add" />
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={adding}
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {adding ? t("investments.saving") : t("investments.submitAdd")}
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

      {editingInvestmentId && editForm ? (
        <WalletFormModal
          title={t("investments.editTitle")}
          description={
            editForm.isFixedReturn
              ? t("investments.editDescFixed")
              : t("investments.editDescVariable")
          }
          onClose={onCloseEdit}
        >
          <form onSubmit={onEditSubmit} className="mt-6 space-y-4">
            <InvestmentFormFields form={editForm} onChange={setEditForm} idPrefix="edit" />
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={savingEdit}
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {savingEdit ? t("investments.saving") : t("investments.submitEdit")}
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

      {profitInvestmentId && profitInvestment ? (
        <InvestmentProfitModal
          investment={profitInvestment}
          entries={profitEntries}
          currency={currency}
          form={profitForm}
          saving={savingProfit}
          onChange={setProfitForm}
          onSubmit={onProfitSubmit}
          onDeleteEntry={onDeleteProfitEntry}
          onClose={onCloseProfit}
        />
      ) : null}

      {valueInvestmentId && valueInvestment && valueForm ? (
        <InvestmentValueModal
          investment={valueInvestment}
          currency={currency}
          form={valueForm}
          saving={savingValue}
          onChange={setValueForm}
          onSubmit={onValueSubmit}
          onClose={onCloseValue}
        />
      ) : null}

      {historyInvestmentId && historyInvestment ? (
        <InvestmentValueHistoryModal
          investmentName={historyInvestment.name}
          investmentIcon={historyInvestment.icon}
          updates={historyUpdates}
          currency={currency}
          onClose={onCloseHistory}
        />
      ) : null}
    </>
  );
}
