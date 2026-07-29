"use client";

import type { WalletReconciliation } from "@/lib/types/database";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { getReconciliationResolutionLabel } from "@/lib/constants/reconciliation-options";

function DifferenceBadge({
  difference,
  currency,
}: {
  difference: number;
  currency: string;
}) {
  if (Math.abs(difference) < 0.005) {
    return <span className="font-medium text-emerald-700">متطابق ✓</span>;
  }

  const formatted = formatCurrency(Math.abs(difference), currency);
  const prefix = difference > 0 ? "+" : "−";

  return (
    <span className="font-medium text-amber-700">
      {prefix}
      {formatted}
    </span>
  );
}

export default function WalletReconciliationHistory({
  reconciliations,
  currency,
}: {
  reconciliations: WalletReconciliation[];
  currency: string;
}) {
  if (reconciliations.length === 0) {
    return (
      <p className="mt-4 text-sm text-slate-500">
        لم يتم تحديث أي رصيد بعد. اضغط «تحديث أرصدة المحافظ» لمقارنة الأرصدة بالواقع.
      </p>
    );
  }

  return (
    <div className="mt-4 x-scroll">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="px-3 py-3 text-right font-medium">التاريخ</th>
            <th className="px-3 py-3 text-right font-medium">المحفظة</th>
            <th className="px-3 py-3 text-right font-medium">المسجّل</th>
            <th className="px-3 py-3 text-right font-medium">الفعلي</th>
            <th className="px-3 py-3 text-right font-medium">الفرق</th>
            <th className="px-3 py-3 text-right font-medium">الإجراء</th>
          </tr>
        </thead>
        <tbody>
          {reconciliations.map((reconciliation) => (
            <tr key={reconciliation.id} className="border-b border-slate-100 last:border-0">
              <td className="px-3 py-4 text-slate-600">
                {formatDate(reconciliation.reconciled_at)}
              </td>
              <td className="px-3 py-4">
                <span className="font-medium text-slate-900">
                  {reconciliation.wallets?.icon} {reconciliation.wallets?.name ?? "—"}
                </span>
              </td>
              <td className="px-3 py-4 text-slate-700">
                {formatCurrency(Number(reconciliation.recorded_balance), currency)}
              </td>
              <td className="px-3 py-4 text-slate-700">
                {formatCurrency(Number(reconciliation.actual_balance), currency)}
              </td>
              <td className="px-3 py-4">
                <DifferenceBadge
                  difference={Number(reconciliation.difference)}
                  currency={currency}
                />
              </td>
              <td className="px-3 py-4 text-slate-600">
                {getReconciliationResolutionLabel(reconciliation.resolution)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { DifferenceBadge };
