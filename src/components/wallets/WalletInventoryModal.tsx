"use client";

import { DifferenceBadge } from "@/components/wallets/WalletReconciliationHistory";
import ModalShell from "@/components/ui/ModalShell";
import { createClient } from "@/lib/supabase/client";
import type { Transaction, Wallet } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils/format";
import {
  buildInventoryDisplayRows,
  buildReconciliationPreview,
  calculateWalletBalance,
  getActualBalanceLabel,
  getInventoryNetAdjustment,
  getRecordedBalanceLabel,
  isCreditWallet,
  isInvestmentWallet,
} from "@/lib/wallets";
import { FormEvent, useMemo, useState } from "react";

type WalletInventoryModalProps = {
  wallets: Wallet[];
  transactions: Transaction[];
  currency: string;
  focusWalletId?: string | null;
  onClose: () => void;
  onComplete: () => Promise<void>;
};

export default function WalletInventoryModal({
  wallets,
  transactions,
  currency,
  focusWalletId = null,
  onClose,
  onComplete,
}: WalletInventoryModalProps) {
  const walletRows = useMemo(
    () => buildInventoryDisplayRows(wallets, focusWalletId),
    [focusWalletId, wallets],
  );

  const editableWallets = useMemo(
    () => walletRows.filter((row) => row.editable).map((row) => row.wallet),
    [walletRows],
  );

  const [actualBalanceEdits, setActualBalanceEdits] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getActualBalanceInput(wallet: Wallet) {
    const edited = actualBalanceEdits[wallet.id];

    if (edited !== undefined) {
      return edited;
    }

    return String(calculateWalletBalance(wallet, transactions));
  }

  const previews = useMemo(() => {
    return editableWallets.map((wallet) => {
      const actualBalance = Number(getActualBalanceInput(wallet)) || 0;

      return {
        wallet,
        ...buildReconciliationPreview(wallet, transactions, actualBalance),
      };
    });
  }, [editableWallets, actualBalanceEdits, transactions]);

  const summary = useMemo(() => {
    const mismatched = previews.filter((preview) => !preview.isMatched);
    const netAdjustment = getInventoryNetAdjustment(previews);

    return {
      total: previews.length,
      matched: previews.length - mismatched.length,
      mismatched: mismatched.length,
      netAdjustment,
    };
  }, [previews]);

  const focusWallet = focusWalletId
    ? wallets.find((wallet) => wallet.id === focusWalletId)
    : null;

  function updateActualBalance(walletId: string, actualBalance: string) {
    setActualBalanceEdits((current) => ({
      ...current,
      [walletId]: actualBalance,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const trimmedNote = note.trim() || null;

    const { error: reconcileError } = await supabase.rpc("reconcile_wallets_batch", {
      p_items: previews.map((preview) => ({
        wallet_id: preview.wallet.id,
        actual_balance: preview.actualBalance,
      })),
      p_note: trimmedNote,
    });

    if (reconcileError) {
      setError(reconcileError.message);
      setSaving(false);
      return;
    }

    await onComplete();
    onClose();
  }

  return (
    <ModalShell onClose={onClose} maxWidthClassName="sm:max-w-4xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {focusWalletId ? "تحديث رصيد المحفظة" : "تحديث أرصدة المحافظ"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {focusWallet && walletRows.length > 1
              ? `حدّث المحافظ الفرعية التابعة لـ ${focusWallet.name}.`
              : "أدخل الرصيد الفعلي من البنك أو الكاش في الخانة أدناه."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-3 py-1 text-sm text-slate-500 transition hover:bg-slate-100"
        >
          إغلاق
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {walletRows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-5 text-sm text-amber-900">
            <p className="font-medium">لا توجد محفظة قابلة للتحديث هنا.</p>
            <p className="mt-2 leading-7 text-amber-800">
              {focusWallet
                ? "المحفظة الرئيسية تجمع أرصدة المحافظ الفرعية. افتح المحافظ الفرعية من الجدول وحدّث كل واحدة على حدة."
                : "أضف محفظة بنك أو كاش أولاً، أو حدّث المحافظ الفرعية داخل البنوك."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">
              أدخل الرصيد الفعلي ({editableWallets.length} محفظة قابلة للتحديث)
            </p>

            {walletRows.map(({ wallet, depth, editable, parentName }) => {
              if (!editable) {
                return (
                  <article
                    key={wallet.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    style={{ marginRight: `${depth * 0.75}rem` }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                        {wallet.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">{wallet.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {isInvestmentWallet(wallet)
                            ? "يُحدَّث من صفحة الاستثمارات"
                            : "محفظة رئيسية — حدّث المحافظ الفرعية تحتها"}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              }

              const preview = previews.find((item) => item.wallet.id === wallet.id);

              if (!preview) {
                return null;
              }

              const actualBalanceLabel = getActualBalanceLabel(wallet);
              const isCredit = isCreditWallet(wallet);

              return (
                <article
                  key={wallet.id}
                  className="rounded-2xl border-2 border-emerald-100 bg-emerald-50/40 p-4"
                  style={{ marginRight: `${depth * 0.75}rem` }}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                      {wallet.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{wallet.name}</p>
                      {parentName ? (
                        <p className="mt-0.5 text-xs text-emerald-700">تحت {parentName}</p>
                      ) : null}
                      <p className="mt-0.5 text-xs text-slate-500">{getRecordedBalanceLabel(wallet)}</p>
                    </div>
                  </div>

                  <label className="mt-4 block space-y-2">
                    <span className="text-sm font-semibold text-emerald-900">
                      {actualBalanceLabel}
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      required
                      value={getActualBalanceInput(wallet)}
                      onChange={(event) => updateActualBalance(wallet.id, event.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-2xl border-2 border-emerald-200 bg-white px-4 py-3.5 text-lg font-semibold text-slate-900 outline-none focus:border-emerald-500"
                    />
                    {isCredit ? (
                      <span className="block text-xs leading-6 text-slate-600">
                        أدخل المبلغ المستحق على الكارت كما يظهر في تطبيق البنك.
                      </span>
                    ) : (
                      <span className="block text-xs leading-6 text-slate-600">
                        أدخل الرصيد الحالي في حسابك أو محفظتك.
                      </span>
                    )}
                  </label>

                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-white/80 p-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">المسجّل في التطبيق</p>
                      <p className="mt-1 font-medium text-slate-700">
                        {formatCurrency(preview.recordedBalance, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">الفرق</p>
                      <div className="mt-1">
                        <DifferenceBadge difference={preview.difference} currency={currency} />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {walletRows.length > 0 ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryChip label="المحافظ" value={String(summary.total)} tone="neutral" />
              <SummaryChip label="متطابقة" value={String(summary.matched)} tone="success" />
              <SummaryChip label="فيها فرق" value={String(summary.mismatched)} tone="warning" />
            </div>

            {summary.mismatched > 0 ? (
              <div className="space-y-2">
                <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  صافي الفروقات: {formatCurrency(summary.netAdjustment, currency)}
                </p>
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {Math.abs(summary.netAdjustment) < 0.005
                    ? "صافي الفروقات صفر، لذلك مش هتتسجل عملية إيراد أو مصروف. أرصدة المحافظ هتتظبط للرقم الفعلي."
                    : summary.netAdjustment > 0
                      ? `هتتسجل عملية واحدة: إيراد غير معروف بمبلغ ${formatCurrency(Math.abs(summary.netAdjustment), currency)}.`
                      : `هتتسجل عملية واحدة: مصروف غير معروف بمبلغ ${formatCurrency(Math.abs(summary.netAdjustment), currency)}.`}
                </p>
              </div>
            ) : (
              <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                كل المحافظ متطابقة مع الواقع حتى الآن. غيّر الرصيد الفعلي إذا كان مختلفاً.
              </p>
            )}
          </>
        ) : null}

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">ملاحظة (اختياري)</span>
          <input
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="مثال: تحديث بعد كشف حساب البنك"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving || walletRows.length === 0}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? "جاري التحديث..." : "حفظ التحديث"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            إلغاء
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function SummaryChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "neutral" | "success" | "warning";
}) {
  const toneClasses = {
    neutral: "bg-slate-50 text-slate-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
  };

  return (
    <div className={`rounded-2xl px-4 py-3 ${toneClasses[tone]}`}>
      <p className="text-xs">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
