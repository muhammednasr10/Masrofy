"use client";

import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import InvestmentsPageModals from "@/components/investments/InvestmentsPageModals";
import InvestmentsSummaryCard from "@/components/investments/InvestmentsSummaryCard";
import InvestmentsTable from "@/components/investments/InvestmentsTable";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { useInvestmentsPage } from "@/hooks/useInvestmentsPage";

export default function InvestmentsPage() {
  const t = useTranslations();
  const {
    loading,
    currency,
    summary,
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
    reorderingId,
    error,
    message,
    profitEntriesByInvestment,
    setAddForm,
    setEditForm,
    setProfitForm,
    setValueForm,
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
    openProfitModal,
    closeProfitModal,
    openValueModal,
    closeValueModal,
    openHistoryModal,
    closeHistoryModal,
    handleAddSubmit,
    handleEditSubmit,
    handleProfitSubmit,
    handleValueSubmit,
    handleDeleteProfitEntry,
    handleMoveInvestment,
    handleDelete,
  } = useInvestmentsPage();

  if (loading) {
    return <p className="text-sm text-slate-500">{t("investments.loading")}</p>;
  }

  return (
    <div className="space-y-6">
      <InvestmentsSummaryCard
        totalCostBasis={summary.totalCostBasis}
        totalCurrentValue={summary.totalCurrentValue}
        totalProfit={summary.totalProfit}
        totalReturnPercent={summary.totalReturnPercent}
        currency={currency}
      />

      <FeedbackBanner error={error} message={message} />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={openAddModal}
          className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          {t("investments.addButton")}
        </button>
      </div>

      <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">{t("investments.sectionTitle")}</h2>
        <p className="mt-1 text-sm text-slate-500">{t("investments.sectionDesc")}</p>
        <InvestmentsTable
          rows={summary.items}
          currency={currency}
          profitEntriesByInvestment={profitEntriesByInvestment}
          reorderingId={reorderingId}
          onMoveInvestment={handleMoveInvestment}
          onEditInvestment={openEditModal}
          onLogProfit={openProfitModal}
          onUpdateValue={openValueModal}
          onViewHistory={openHistoryModal}
          onDeleteInvestment={handleDelete}
        />
      </section>

      <InvestmentsPageModals
        currency={currency}
        addForm={addForm}
        editForm={editForm}
        profitForm={profitForm}
        valueForm={valueForm}
        profitInvestment={profitInvestment}
        valueInvestment={valueInvestment}
        historyInvestment={historyInvestment}
        historyUpdates={historyUpdates}
        profitEntries={profitEntries}
        editingInvestmentId={editingInvestmentId}
        profitInvestmentId={profitInvestmentId}
        valueInvestmentId={valueInvestmentId}
        historyInvestmentId={historyInvestmentId}
        showAddModal={showAddModal}
        adding={adding}
        savingEdit={savingEdit}
        savingProfit={savingProfit}
        savingValue={savingValue}
        setAddForm={setAddForm}
        setEditForm={setEditForm}
        setProfitForm={setProfitForm}
        setValueForm={setValueForm}
        onCloseAdd={closeAddModal}
        onCloseEdit={closeEditModal}
        onCloseProfit={closeProfitModal}
        onCloseValue={closeValueModal}
        onCloseHistory={closeHistoryModal}
        onAddSubmit={handleAddSubmit}
        onEditSubmit={handleEditSubmit}
        onProfitSubmit={handleProfitSubmit}
        onValueSubmit={handleValueSubmit}
        onDeleteProfitEntry={handleDeleteProfitEntry}
      />
    </div>
  );
}
