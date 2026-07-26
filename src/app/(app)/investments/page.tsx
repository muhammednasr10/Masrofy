"use client";

import { FeedbackBanner } from "@/components/wallets/FeedbackBanner";
import InvestmentFormFields from "@/components/investments/InvestmentFormFields";
import InvestmentProfitModal from "@/components/investments/InvestmentProfitModal";
import InvestmentValueHistoryModal from "@/components/investments/InvestmentValueHistoryModal";
import InvestmentValueModal from "@/components/investments/InvestmentValueModal";
import WalletFormModal from "@/components/wallets/WalletFormModal";
import InvestmentsSummaryCard from "@/components/investments/InvestmentsSummaryCard";
import InvestmentsTable from "@/components/investments/InvestmentsTable";
import { useInvestmentsPage } from "@/hooks/useInvestmentsPage";

export default function InvestmentsPage() {
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
    return <p className="text-sm text-slate-500">جاري تحميل الاستثمارات...</p>;
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
          + إضافة استثمار
        </button>
      </div>

      <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">استثماراتك</h2>
        <p className="mt-1 text-sm text-slate-500">
          الربح الثابت للودائع والشهادات، أو سجّل أرباحك يدويًا لاستثمارات زي بينانس.
        </p>
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

      {showAddModal ? (
        <WalletFormModal
          title="إضافة استثمار"
          description={
            addForm.isFixedReturn
              ? "سجّل المبلغ المستثمر ونسبة الربح الثابت وميعاد القبض."
              : "سجّل المبلغ المستثمر فقط — وبعدها سجّل أرباحك من زر 💰."
          }
          onClose={closeAddModal}
        >
          <form onSubmit={handleAddSubmit} className="mt-6 space-y-4">
            <InvestmentFormFields form={addForm} onChange={setAddForm} idPrefix="add" />
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={adding}
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {adding ? "جاري الحفظ..." : "إضافة الاستثمار"}
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

      {editingInvestmentId && editForm ? (
        <WalletFormModal
          title="تعديل الاستثمار"
          description={
            editForm.isFixedReturn
              ? "حدّث بيانات الاستثمار ذي الربح الثابت."
              : "حدّث بيانات الاستثمار — الأرباح تُسجّل من زر 💰."
          }
          onClose={closeEditModal}
        >
          <form onSubmit={handleEditSubmit} className="mt-6 space-y-4">
            <InvestmentFormFields form={editForm} onChange={setEditForm} idPrefix="edit" />
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

      {profitInvestmentId && profitInvestment ? (
        <InvestmentProfitModal
          investment={profitInvestment}
          entries={profitEntries}
          currency={currency}
          form={profitForm}
          saving={savingProfit}
          onChange={setProfitForm}
          onSubmit={handleProfitSubmit}
          onDeleteEntry={handleDeleteProfitEntry}
          onClose={closeProfitModal}
        />
      ) : null}

      {valueInvestmentId && valueInvestment && valueForm ? (
        <InvestmentValueModal
          investment={valueInvestment}
          currency={currency}
          form={valueForm}
          saving={savingValue}
          onChange={setValueForm}
          onSubmit={handleValueSubmit}
          onClose={closeValueModal}
        />
      ) : null}

      {historyInvestmentId && historyInvestment ? (
        <InvestmentValueHistoryModal
          investmentName={historyInvestment.name}
          investmentIcon={historyInvestment.icon}
          updates={historyUpdates}
          currency={currency}
          onClose={closeHistoryModal}
        />
      ) : null}
    </div>
  );
}
