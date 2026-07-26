"use client";

import ModalShell from "@/components/ui/ModalShell";
import type { SavingsGoal } from "@/lib/types/database";
import { FormEvent, useState } from "react";

type SavingsContributionModalProps = {
  goal: SavingsGoal;
  submitting: boolean;
  onSubmit: (amount: number) => Promise<void>;
  onClose: () => void;
};

export default function SavingsContributionModal({
  goal,
  submitting,
  onSubmit,
  onClose,
}: SavingsContributionModalProps) {
  const [amount, setAmount] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(Number(amount));
  }

  return (
    <ModalShell onClose={onClose} maxWidthClassName="sm:max-w-md">
      <h2 className="text-xl font-semibold text-slate-900">إيداع في {goal.name}</h2>
      <p className="mt-1 text-sm text-slate-500">سجّل مبلغاً وفّرته نحو هذا الهدف.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">المبلغ</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? "جاري الحفظ..." : "تسجيل الإيداع"}
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
