"use client";

import { DifferenceBadge } from "@/components/wallets/WalletReconciliationHistory";
import ModalShell from "@/components/ui/ModalShell";
import { createClient } from "@/lib/supabase/client";
import type { Transaction, Wallet } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils/format";
import {
  buildReconciliationPreview,
  buildWalletDisplayRows,
  calculateWalletBalance,
  getActualBalanceLabel,
  getRecordedBalanceLabel,
  getReconcilableWallets,
  getReconciliationAdjustmentLabel,
  isCreditWallet,
} from "@/lib/wallets";
import { FormEvent, useMemo, useState } from "react";

type InventoryRow = {
  walletId: string;
  actualBalance: string;
};

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
  const reconcilableWallets = useMemo(() => getReconcilableWallets(wallets), [wallets]);
  const walletRows = useMemo(
    () =>
      buildWalletDisplayRows(reconcilableWallets).filter(({ wallet }) =>
        focusWalletId ? wallet.id === focusWalletId : true,
      ),
    [reconcilableWallets, focusWalletId],
  );

  const [rows, setRows] = useState<InventoryRow[]>(() =>
    walletRows.map(({ wallet }) => ({
      walletId: wallet.id,
      actualBalance: String(calculateWalletBalance(wallet, transactions)),
    })),
  );
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previews = useMemo(() => {
    return walletRows.map(({ wallet }) => {
      const row = rows.find((item) => item.walletId === wallet.id);
      const actualBalance = Number(row?.actualBalance) || 0;

      return {
        wallet,
        ...buildReconciliationPreview(wallet, transactions, actualBalance),
      };
    });
  }, [walletRows, rows, transactions]);

  const summary = useMemo(() => {
    const mismatched = previews.filter((preview) => !preview.isMatched);
    const totalDifference = previews.reduce((sum, preview) => sum + preview.difference, 0);

    return {
      total: previews.length,
      matched: previews.length - mismatched.length,
      mismatched: mismatched.length,
      totalDifference,
    };
  }, [previews]);

  function updateActualBalance(walletId: string, actualBalance: string) {
    setRows((current) =>
      current.map((row) => (row.walletId === walletId ? { ...row, actualBalance } : row)),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const trimmedNote = note.trim() || null;

    for (const preview of previews) {
      const { error: reconcileError } = await supabase.rpc("reconcile_wallet", {
        p_wallet_id: preview.wallet.id,
        p_actual_balance: preview.actualBalance,
        p_resolution: "adjustment_tx",
        p_note: trimmedNote,
      });

      if (reconcileError) {
        setError(`${preview.wallet.name}: ${reconcileError.message}`);
        setSaving(false);
        return;
      }
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
              أدخل الرصيد الفعلي من البنك أو الكاش. أي فرق يُسجَّل تلقائياً كإيراد غير معروف أو مصروف
              غير معروف.
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

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <SummaryChip label="المحافظ" value={String(summary.total)} tone="neutral" />
          <SummaryChip label="متطابقة" value={String(summary.matched)} tone="success" />
          <SummaryChip label="فيها فرق" value={String(summary.mismatched)} tone="warning" />
        </div>

          {summary.mismatched > 0 ? (
            <div className="mt-4 space-y-2">
              <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                إجمالي الفروقات: {formatCurrency(summary.totalDifference, currency)}
              </p>
              <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                الفروقات تُسجَّل تلقائياً: زيادة الرصيد → إيراد غير معروف، نقص الرصيد → مصروف غير
                معروف.
              </p>
            </div>
          ) : (
          <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            كل المحافظ متطابقة مع الواقع حتى الآن.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="space-y-3 md:hidden">
            {walletRows.map(({ wallet, depth }) => {
              const preview = previews.find((item) => item.wallet.id === wallet.id);
              const row = rows.find((item) => item.walletId === wallet.id);

              if (!preview || !row) {
                return null;
              }

              return (
                <article
                  key={wallet.id}
                  className="rounded-2xl border border-slate-100 p-4"
                  style={{ marginRight: `${depth * 0.75}rem` }}
                >
                  <div className="flex items-center gap-2">
                    <span>{wallet.icon}</span>
                    <div>
                      <p className="font-medium text-slate-900">{wallet.name}</p>
                      <p className="text-xs text-slate-500">{getRecordedBalanceLabel(wallet)}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">المسجّل</p>
                      <p className="font-medium text-slate-700">
                        {formatCurrency(preview.recordedBalance, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">الفرق</p>
                      <DifferenceBadge difference={preview.difference} currency={currency} />
                      {getReconciliationAdjustmentLabel(
                        preview.difference,
                        isCreditWallet(wallet),
                      ) ? (
                        <p className="mt-1 text-xs text-amber-700">
                          سيُسجَّل:{" "}
                          {getReconciliationAdjustmentLabel(
                            preview.difference,
                            isCreditWallet(wallet),
                          )}{" "}
                          ({formatCurrency(Math.abs(preview.difference), currency)})
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <label className="mt-3 block space-y-1">
                    <span className="text-xs font-medium text-slate-700">
                      {getActualBalanceLabel(wallet)}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={row.actualBalance}
                      onChange={(event) => updateActualBalance(wallet.id, event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-emerald-500"
                    />
                  </label>
                </article>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-slate-100 md:block">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                  <th className="px-3 py-3 text-right font-medium">المحفظة</th>
                  <th className="px-3 py-3 text-right font-medium">المسجّل</th>
                  <th className="px-3 py-3 text-right font-medium">الفعلي</th>
                  <th className="px-3 py-3 text-right font-medium">الفرق</th>
                </tr>
              </thead>
              <tbody>
                {walletRows.map(({ wallet, depth }) => {
                  const preview = previews.find((item) => item.wallet.id === wallet.id);
                  const row = rows.find((item) => item.walletId === wallet.id);

                  if (!preview || !row) {
                    return null;
                  }

                  return (
                    <tr key={wallet.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-4">
                        <div
                          className="flex items-center gap-2"
                          style={{ paddingRight: `${depth * 1.25}rem` }}
                        >
                          <span>{wallet.icon}</span>
                          <div>
                            <p className="font-medium text-slate-900">{wallet.name}</p>
                            <p className="text-xs text-slate-500">
                              {getRecordedBalanceLabel(wallet)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 font-medium text-slate-700">
                        {formatCurrency(preview.recordedBalance, currency)}
                      </td>
                      <td className="px-3 py-4">
                        <label className="block space-y-1">
                          <span className="sr-only">{getActualBalanceLabel(wallet)}</span>
                          <input
                            type="number"
                            step="0.01"
                            value={row.actualBalance}
                            onChange={(event) =>
                              updateActualBalance(wallet.id, event.target.value)
                            }
                            className="w-full min-w-[120px] rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500"
                          />
                        </label>
                      </td>
                      <td className="px-3 py-4">
                        <DifferenceBadge difference={preview.difference} currency={currency} />
                        {getReconciliationAdjustmentLabel(
                          preview.difference,
                          isCreditWallet(wallet),
                        ) ? (
                          <p className="mt-1 text-xs text-amber-700">
                            {getReconciliationAdjustmentLabel(
                              preview.difference,
                              isCreditWallet(wallet),
                            )}{" "}
                            ({formatCurrency(Math.abs(preview.difference), currency)})
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

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
