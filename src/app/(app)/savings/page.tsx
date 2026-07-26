"use client";

import SavingsContributionModal from "@/components/savings/SavingsContributionModal";
import SavingsGoalFormModal from "@/components/savings/SavingsGoalFormModal";
import SavingsGoalsList from "@/components/savings/SavingsGoalsList";
import { FeedbackBanner } from "@/components/wallets/FeedbackBanner";
import { useSavingsGoalsPage } from "@/hooks/useSavingsGoalsPage";
import { formatCurrency } from "@/lib/utils/format";

export default function SavingsGoalsPage() {
  const {
    loading,
    currency,
    goals,
    summary,
    addForm,
    editForm,
    editingGoalId,
    contributionGoal,
    showAddModal,
    submitting,
    error,
    message,
    setAddForm,
    setEditForm,
    setContributionGoal,
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
    handleAddSubmit,
    handleEditSubmit,
    handleContribution,
    handleDelete,
  } = useSavingsGoalsPage();

  if (loading) {
    return <p className="text-sm text-slate-500">جاري تحميل أهداف الادّخار...</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white bg-gradient-to-br from-teal-600 to-emerald-700 p-5 text-white shadow-sm sm:p-6">
        <p className="text-sm text-emerald-100">أهداف الادّخار</p>
        <p className="mt-2 text-3xl font-semibold">
          {formatCurrency(summary.totalSaved, currency)}
        </p>
        <p className="mt-2 text-sm text-emerald-100">
          {summary.activeCount} هدف نشط • {summary.overallProgress}% من إجمالي {formatCurrency(summary.totalTarget, currency)}
        </p>
      </section>

      <FeedbackBanner error={error} message={message} />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={openAddModal}
          className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          + هدف جديد
        </button>
      </div>

      <section className="rounded-3xl border border-white bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-slate-900">أهدافك</h2>
        <p className="mt-1 text-sm text-slate-500">
          حدّد مبلغاً مستهدفاً وتاريخاً وتابع تقدمك خطوة بخطوة.
        </p>
        <SavingsGoalsList
          goals={goals}
          currency={currency}
          onEdit={openEditModal}
          onAddContribution={setContributionGoal}
          onDelete={handleDelete}
        />
      </section>

      {showAddModal ? (
        <SavingsGoalFormModal
          title="هدف ادّخار جديد"
          form={addForm}
          submitting={submitting}
          onChange={setAddForm}
          onSubmit={handleAddSubmit}
          onClose={closeAddModal}
        />
      ) : null}

      {editingGoalId && editForm ? (
        <SavingsGoalFormModal
          title="تعديل الهدف"
          form={editForm}
          submitting={submitting}
          onChange={setEditForm}
          onSubmit={handleEditSubmit}
          onClose={closeEditModal}
        />
      ) : null}

      {contributionGoal ? (
        <SavingsContributionModal
          goal={contributionGoal}
          submitting={submitting}
          onSubmit={handleContribution}
          onClose={() => setContributionGoal(null)}
        />
      ) : null}
    </div>
  );
}
