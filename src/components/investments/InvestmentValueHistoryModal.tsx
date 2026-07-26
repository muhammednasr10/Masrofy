"use client";

import ModalShell from "@/components/ui/ModalShell";
import type { InvestmentUpdate } from "@/lib/types/database";
import { formatCurrency, formatDate } from "@/lib/utils/format";

type InvestmentValueHistoryModalProps = {
  investmentName: string;
  investmentIcon: string;
  updates: InvestmentUpdate[];
  currency: string;
  onClose: () => void;
};

export default function InvestmentValueHistoryModal({
  investmentName,
  investmentIcon,
  updates,
  currency,
  onClose,
}: InvestmentValueHistoryModalProps) {
  return (
    <ModalShell onClose={onClose} maxWidthClassName="sm:max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {investmentIcon} سجل قيمة {investmentName}
          </h2>
          <p className="mt-1 text-sm text-slate-500">تاريخ تحديثات القيمة الحالية.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-3 py-1 text-sm text-slate-500 transition hover:bg-slate-100"
        >
          إغلاق
        </button>
      </div>

      {updates.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">لا توجد تحديثات مسجّلة بعد.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {updates.map((update) => {
            const delta = Number(update.new_value) - Number(update.previous_value);

            return (
              <li
                key={update.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">
                      {formatCurrency(Number(update.previous_value), currency)} →{" "}
                      {formatCurrency(Number(update.new_value), currency)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(update.recorded_at.slice(0, 10))}
                      {update.note ? ` • ${update.note}` : ""}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 font-semibold ${
                      delta >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {delta >= 0 ? "+" : ""}
                    {formatCurrency(delta, currency)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </ModalShell>
  );
}
