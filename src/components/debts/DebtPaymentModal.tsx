"use client";

import ModalShell from "@/components/ui/ModalShell";
import type { DebtRow } from "@/hooks/useDebtsPage";
import { formatCurrency } from "@/lib/utils/format";
import { FormEvent, useState } from "react";

const fieldClass =
  "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500";

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export default function DebtPaymentModal({
  debt,
  currency,
  submitting,
  onSubmit,
  onClose,
}: {
  debt: DebtRow;
  currency: string;
  submitting: boolean;
  onSubmit: (amount: string, paidOn: string) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [paidOn, setPaidOn] = useState(todayKey);
  const verb = debt.direction === "i_owe" ? "يتخصم من المحفظة" : "يتزاد على المحفظة";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(amount, paidOn);
  }

  return (
    <ModalShell onClose={onClose} dialog maxWidthClassName="sm:max-w-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">دفعة {debt.name}</h2>
          <p className="mt-1 text-sm text-slate-500">
            الباقي {formatCurrency(debt.remaining, currency)}. {verb}. لو التاريخ لسه جاي، الباقي يفضل زي ما هو لحد اليوم ده.
          </p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-sm text-slate-500 hover:bg-slate-100">
          إغلاق
        </button>
      </div>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">المبلغ</span>
          <input
            type="number"
            min="0.01"
            max={debt.room}
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
            className={fieldClass}
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">التاريخ</span>
          <input type="date" value={paidOn} onChange={(event) => setPaidOn(event.target.value)} required className={fieldClass} />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? "جاري التسجيل..." : "تسجيل الدفعة"}
        </button>
      </form>
    </ModalShell>
  );
}
