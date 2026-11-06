"use client";

import DebtFormModal from "@/components/debts/DebtFormModal";
import DebtPaymentModal from "@/components/debts/DebtPaymentModal";
import DebtsTable from "@/components/debts/DebtsTable";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { useDebtsPage } from "@/hooks/useDebtsPage";
import { formatCurrency } from "@/lib/utils/format";
import { FormEvent } from "react";

export default function DebtsPage() {
  const page = useDebtsPage();

  if (page.loading) {
    return <p className="text-sm text-slate-500">جاري تحميل الديون...</p>;
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void page.handleSave();
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl bg-rose-600 p-5 text-white shadow-sm">
          <p className="text-sm text-rose-100">عليّ</p>
          <p className="mt-2 text-3xl font-semibold">{formatCurrency(page.summary.iOwe, page.currency)}</p>
        </div>
        <div className="rounded-3xl bg-emerald-600 p-5 text-white shadow-sm">
          <p className="text-sm text-emerald-100">لي</p>
          <p className="mt-2 text-3xl font-semibold">{formatCurrency(page.summary.owedToMe, page.currency)}</p>
        </div>
      </section>

      <FeedbackBanner error={page.error} message={page.message} />

      <section className="rounded-3xl border border-white bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">الديون</h1>
            <p className="mt-1 text-sm text-slate-500">
              القسط يتسجل من فئة في وضع الخطة. لما الدفعة تتحسب، الباقي هنا ينقص.
            </p>
          </div>
          <button
            type="button"
            onClick={page.openCreate}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + دين
          </button>
        </div>
        <div className="mt-5">
          <DebtsTable
            rows={page.rows}
            categories={page.categories}
            currency={page.currency}
            onEdit={page.openEdit}
            onPayment={page.setPaymentDebt}
            onDelete={(debtId) => void page.handleDelete(debtId)}
          />
        </div>
      </section>

      {page.form ? (
        <DebtFormModal
          title={page.editingId ? "تعديل الدين" : "دين جديد"}
          form={page.form}
          categories={page.categories}
          wallets={page.wallets}
          submitting={page.submitting}
          onChange={page.setForm}
          onSubmit={handleSave}
          onClose={page.closeForm}
        />
      ) : null}

      {page.paymentDebt ? (
        <DebtPaymentModal
          debt={page.paymentDebt}
          currency={page.currency}
          submitting={page.submitting}
          onSubmit={(amount, paidOn) => void page.handlePayment(amount, paidOn)}
          onClose={() => page.setPaymentDebt(null)}
        />
      ) : null}
    </div>
  );
}
