"use client";

import ModalShell from "@/components/ui/ModalShell";
import WalletSelect from "@/components/wallets/WalletSelect";
import type { Wallet } from "@/lib/types/database";
import type { WalletTransferFormState } from "@/lib/wallets/transfer";
import { FormEvent } from "react";

type WalletTransferModalProps = {
  wallets: Wallet[];
  form: WalletTransferFormState;
  submitting: boolean;
  onChange: (next: WalletTransferFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export default function WalletTransferModal({
  wallets,
  form,
  submitting,
  onChange,
  onSubmit,
  onClose,
}: WalletTransferModalProps) {
  return (
    <ModalShell onClose={onClose} maxWidthClassName="sm:max-w-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">تحويل بين المحافظ</h2>
          <p className="mt-1 text-sm text-slate-500">
            انقل مبلغاً من محفظة لأخرى بدون ما يظهر كمصروف أو دخل.
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

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">من محفظة</span>
          <WalletSelect
            wallets={wallets}
            value={form.fromWalletId}
            onChange={(fromWalletId) => onChange({ ...form, fromWalletId })}
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">إلى محفظة</span>
          <WalletSelect
            wallets={wallets}
            value={form.toWalletId}
            onChange={(toWalletId) => onChange({ ...form, toWalletId })}
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">المبلغ</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            required
            value={form.amount}
            onChange={(event) => onChange({ ...form, amount: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">التاريخ</span>
          <input
            type="date"
            required
            value={form.transactionDate}
            onChange={(event) => onChange({ ...form, transactionDate: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">ملاحظة</span>
          <input
            type="text"
            value={form.note}
            onChange={(event) => onChange({ ...form, note: event.target.value })}
            placeholder="اختياري"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? "جاري التحويل..." : "تنفيذ التحويل"}
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
