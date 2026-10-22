"use client";

import CategoryFormModal from "@/components/categories/CategoryFormModal";
import QuickAddExpenseFields from "@/components/expenses/QuickAddExpenseFields";
import { useQuickAddExpense } from "@/hooks/useQuickAddExpense";

type QuickAddExpenseSheetProps = {
  onClose: () => void;
  onOpenFullForm: () => void;
  initialCategoryId?: string | null;
};

export default function QuickAddExpenseSheet({
  onClose,
  onOpenFullForm,
  initialCategoryId,
}: QuickAddExpenseSheetProps) {
  const {
    t,
    sheetRef,
    categories,
    wallets,
    amount,
    setAmount,
    categoryId,
    setCategoryId,
    walletId,
    setWalletId,
    loading,
    submitting,
    error,
    notice,
    typedCategoryName,
    setTypedCategoryName,
    autoFocusAmount,
    categoryForm,
    transactionDate,
    handleSubmit,
  } = useQuickAddExpense({ initialCategoryId, onClose });

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-slate-900/25"
        aria-label={t("common.close")}
        onClick={onClose}
      />
      <form
        ref={sheetRef}
        onSubmit={handleSubmit}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[calc(100dvh-env(safe-area-inset-top,0px)-0.5rem)] flex-col overflow-hidden rounded-t-3xl border border-emerald-100 bg-white shadow-2xl md:inset-x-auto md:bottom-28 md:end-4 md:max-h-[min(32rem,calc(100dvh-6rem))] md:w-[22rem] md:rounded-3xl"
      >
        <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-slate-200 md:hidden" />
        <div className="flex items-center justify-between gap-2 px-4 pt-2 md:pt-3">
          <h2 className="min-w-0 truncate text-base font-semibold text-slate-900">
            {t("expenses.quickAddTitle")}
          </h2>
          <div className="flex shrink-0 items-center">
            <button
              type="button"
              onClick={onOpenFullForm}
              className="min-h-11 px-2 text-sm font-medium text-emerald-700"
            >
              {t("expenses.quickAddMore")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 px-2 text-sm text-slate-500 md:hidden"
            >
              {t("common.close")}
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {loading ? (
            <p className="text-sm text-slate-500">{t("common.loading")}</p>
          ) : wallets.length === 0 ? (
            <p className="text-sm text-slate-600">{t("expenses.needWallet")}</p>
          ) : (
            <QuickAddExpenseFields
              amount={amount}
              autoFocusAmount={autoFocusAmount}
              categoryId={categoryId}
              walletId={walletId}
              categories={categories}
              wallets={wallets}
              typedCategoryName={typedCategoryName}
              transactionDate={transactionDate}
              onAmountChange={setAmount}
              onCategoryChange={setCategoryId}
              onWalletChange={setWalletId}
              onTypedCategoryNameChange={setTypedCategoryName}
              onCreateCategory={(name) => categoryForm.openForm(null, name)}
            />
          )}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}
        </div>

        <div className="border-t border-slate-100 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] md:border-0 md:pb-4">
          <button
            type="submit"
            disabled={loading || submitting || wallets.length === 0}
            className="min-h-12 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? t("expenses.quickAddSaving") : t("expenses.quickAddSave")}
          </button>
        </div>
      </form>

      {categoryForm.form ? (
        <CategoryFormModal
          form={categoryForm.form}
          categories={categories}
          submitting={categoryForm.submitting}
          error={categoryForm.error}
          onChange={categoryForm.setForm}
          onSubmit={categoryForm.handleSubmit}
          onClose={categoryForm.closeForm}
          zIndexClassName="z-[100]"
          compact
        />
      ) : null}
    </>
  );
}
