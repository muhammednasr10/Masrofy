"use client";

import {
  cardKindOptions,
  walletColorOptions,
  walletIconOptions,
  walletTypeOptions,
} from "@/lib/constants/wallet-options";
import { getInvestmentDisplayValue } from "@/lib/investments/utils";
import type { CardKind, Investment, Wallet, WalletType } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils/format";
import { getInvestmentFormBalance, type WalletFormState } from "@/lib/wallets/form";

type WalletFormFieldsProps = {
  form: WalletFormState;
  onChange: (next: WalletFormState) => void;
  idPrefix: string;
  parentWallets: Wallet[];
  investments?: Investment[];
  currency?: string;
  allowParentSelection?: boolean;
  editingWalletId?: string;
};

export default function WalletFormFields({
  form,
  onChange,
  idPrefix,
  parentWallets,
  investments = [],
  currency = "EGP",
  allowParentSelection = false,
  editingWalletId,
}: WalletFormFieldsProps) {
  const isSubWallet = Boolean(form.parentWalletId);
  const isInvestmentType = !isSubWallet && form.walletType === "investment";
  const parentWallet = parentWallets.find((wallet) => wallet.id === form.parentWalletId);
  const selectableParents = parentWallets.filter((wallet) => wallet.id !== editingWalletId);
  const selectedInvestment = investments.find((investment) => investment.id === form.investmentId);
  const investmentBalance = isInvestmentType
    ? getInvestmentFormBalance(form, investments)
    : Number(form.currentBalance) || 0;

  return (
    <>
      {allowParentSelection ? (
        <label className="block space-y-2 lg:col-span-2">
          <span className="text-sm font-medium text-slate-700">المحفظة الرئيسية (اختياري)</span>
          <select
            id={`${idPrefix}-parent`}
            value={form.parentWalletId ?? ""}
            onChange={(event) => {
              const parentWalletId = event.target.value || null;

              onChange({
                ...form,
                parentWalletId,
                walletType: parentWalletId ? "card" : form.walletType,
                cardKind: parentWalletId ? form.cardKind ?? "debit" : null,
                creditLimit: parentWalletId ? form.creditLimit : "",
                investmentId: parentWalletId ? null : form.investmentId,
                icon: parentWalletId ? "💳" : form.walletType === "investment" ? "📈" : form.icon,
              });
            }}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          >
            <option value="">محفظة رئيسية مستقلة</option>
            {selectableParents.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.icon} {wallet.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {parentWallet ? (
        <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 lg:col-span-2">
          تحت: {parentWallet.icon} {parentWallet.name}
        </p>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">اسم المحفظة</span>
        <input
          id={`${idPrefix}-name`}
          type="text"
          required
          value={form.name}
          onChange={(event) => onChange({ ...form, name: event.target.value })}
          placeholder={isSubWallet ? "مثال: كارت Credit" : isInvestmentType ? "مثال: محفظة استثمار" : "مثال: بنك QNB"}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        />
      </label>

      {isSubWallet ? (
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">نوع البطاقة</span>
          <select
            id={`${idPrefix}-card-kind`}
            required
            value={form.cardKind ?? "debit"}
            onChange={(event) =>
              onChange({
                ...form,
                cardKind: event.target.value as CardKind,
                creditLimit: event.target.value === "credit" ? form.creditLimit : "",
              })
            }
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          >
            {cardKindOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">النوع</span>
          <select
            id={`${idPrefix}-type`}
            value={form.walletType}
            onChange={(event) => {
              const walletType = event.target.value as WalletType;

              onChange({
                ...form,
                walletType,
                investmentId: walletType === "investment" ? form.investmentId : null,
                icon: walletType === "investment" ? "📈" : form.icon,
              });
            }}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          >
            {walletTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {isInvestmentType ? (
        <label className="block space-y-2 lg:col-span-2">
          <span className="text-sm font-medium text-slate-700">ربط باستثمار (اختياري)</span>
          <select
            id={`${idPrefix}-investment`}
            value={form.investmentId ?? ""}
            onChange={(event) =>
              onChange({
                ...form,
                investmentId: event.target.value || null,
              })
            }
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          >
            <option value="">كل الاستثمارات (إجمالي المحفظة)</option>
            {investments.map((investment) => (
              <option key={investment.id} value={investment.id}>
                {investment.icon} {investment.name}
              </option>
            ))}
          </select>
          <span className="block text-xs text-slate-500">
            القيمة تُحدَّث تلقائيًا من صفحة الاستثمار.
          </span>
        </label>
      ) : null}

      {form.cardKind === "credit" ? (
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">الحد الائتماني</span>
          <input
            id={`${idPrefix}-credit-limit`}
            type="number"
            min="0"
            step="0.01"
            value={form.creditLimit}
            onChange={(event) => onChange({ ...form, creditLimit: event.target.value })}
            placeholder="مثال: 50000"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>
      ) : null}

      {isInvestmentType ? (
        <div className="space-y-2 lg:col-span-2">
          <span className="text-sm font-medium text-slate-700">القيمة الحالية</span>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="font-semibold text-slate-900">
              {formatCurrency(investmentBalance, currency)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {selectedInvestment
                ? `مرتبطة بـ ${selectedInvestment.icon} ${selectedInvestment.name} — ${formatCurrency(getInvestmentDisplayValue(selectedInvestment), currency)}`
                : "تعكس إجمالي قيمة الاستثمارات الحالية."}
            </p>
          </div>
        </div>
      ) : (
        <label className="block space-y-2 lg:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            {form.cardKind === "credit" ? "المبلغ المستحق حاليًا" : "الرصيد الحالي"}
          </span>
          <input
            id={`${idPrefix}-balance`}
            type="number"
            step="0.01"
            value={form.currentBalance}
            onChange={(event) => onChange({ ...form, currentBalance: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
          {form.cardKind === "credit" ? (
            <span className="block text-xs text-slate-500">
              المصروفات تزيد المستحق، وعمليات الدفع (دخل) تقلله.
            </span>
          ) : null}
        </label>
      )}

      <div className="space-y-2 lg:col-span-2">
        <span className="text-sm font-medium text-slate-700">الأيقونة</span>
        <div className="grid grid-cols-8 gap-2 sm:grid-cols-12">
          {walletIconOptions.map((option) => (
            <button
              key={`${idPrefix}-${option}`}
              type="button"
              onClick={() => onChange({ ...form, icon: option })}
              className={`flex h-10 items-center justify-center rounded-xl text-lg ${
                form.icon === option ? "bg-emerald-100 ring-2 ring-emerald-500" : "bg-slate-50"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 lg:col-span-2">
        <span className="text-sm font-medium text-slate-700">اللون</span>
        <div className="flex flex-wrap gap-2">
          {walletColorOptions.map((option) => (
            <button
              key={`${idPrefix}-${option}`}
              type="button"
              onClick={() => onChange({ ...form, color: option })}
              className={`h-8 w-8 rounded-full border-2 ${
                form.color === option ? "border-slate-900" : "border-white"
              }`}
              style={{ backgroundColor: option }}
              aria-label={option}
            />
          ))}
        </div>
      </div>
    </>
  );
}
