"use client";

import Link from "next/link";
import { FormEvent } from "react";
import WalletSelect from "@/components/wallets/WalletSelect";
import CategorySelect from "@/components/categories/CategorySelect";
import SelectedWalletPanel from "@/components/expenses/SelectedWalletPanel";
import type { Category, TransactionType, Wallet } from "@/lib/types/database";
import type { getSelectedWalletSnapshot } from "@/lib/expenses/display";

type WalletSnapshot = ReturnType<typeof getSelectedWalletSnapshot>;

type TransactionFormProps = {
  categories: Category[];
  wallets: Wallet[];
  currency: string;
  amount: string;
  categoryId: string;
  walletId: string;
  type: TransactionType;
  note: string;
  transactionDate: string;
  receiptFile: File | null;
  submitting: boolean;
  selectedWalletSnapshot: WalletSnapshot;
  onAmountChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onWalletChange: (value: string) => void;
  onTypeChange: (value: TransactionType) => void;
  onNoteChange: (value: string) => void;
  onReceiptChange: (file: File | null) => void;
  onTransactionDateChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function TransactionForm({
  categories,
  wallets,
  currency,
  amount,
  categoryId,
  walletId,
  type,
  note,
  transactionDate,
  receiptFile,
  submitting,
  selectedWalletSnapshot,
  onAmountChange,
  onCategoryChange,
  onWalletChange,
  onTypeChange,
  onNoteChange,
  onReceiptChange,
  onTransactionDateChange,
  onSubmit,
}: TransactionFormProps) {
  if (wallets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
        <p>محتاج تضيف محفظة الأول عشان تسجّل مصروفات أو دخل.</p>
        <Link href="/wallets" className="mt-3 inline-block font-medium text-emerald-700">
          إدارة المحافظ
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">النوع</span>
        <select
          value={type}
          onChange={(event) => onTypeChange(event.target.value as TransactionType)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        >
          <option value="expense">مصروف</option>
          <option value="income">دخل</option>
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">المبلغ</span>
        <input
          type="number"
          min="0.01"
          step="0.01"
          required
          value={amount}
          onChange={(event) => onAmountChange(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        />
      </label>

      <div className="space-y-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">المحفظة</span>
          <WalletSelect
            wallets={wallets}
            value={walletId}
            onChange={onWalletChange}
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>
        <SelectedWalletPanel
          snapshot={selectedWalletSnapshot}
          type={type}
          currency={currency}
        />
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">
          الفئة{type === "income" ? " (اختياري)" : ""}
        </span>
        <CategorySelect
          categories={categories}
          value={categoryId}
          onChange={onCategoryChange}
          allowEmpty={type === "income"}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">التاريخ</span>
        <input
          type="date"
          required
          value={transactionDate}
          onChange={(event) => onTransactionDateChange(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">ملاحظة</span>
        <input
          type="text"
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="اختياري"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">مرفق (إيصال / فاتورة)</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          onChange={(event) => onReceiptChange(event.target.files?.[0] ?? null)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-700 focus:border-emerald-500"
        />
        {receiptFile ? (
          <span className="block text-xs text-slate-500">{receiptFile.name}</span>
        ) : null}
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {submitting ? "جاري الحفظ..." : "حفظ"}
      </button>
    </form>
  );
}
