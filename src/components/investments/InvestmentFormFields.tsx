"use client";

import {
  defaultInvestmentColor,
  defaultInvestmentIcon,
  investmentColorOptions,
  investmentIconOptions,
  collectionPeriodOptions,
  investmentTypeOptions,
  investmentUnitOptions,
} from "@/lib/constants/investment-options";
import {
  getCollectionDateLabel,
  getExpectedProfitLabel,
  getFixedReturnPercentLabel,
  getFixedProfitAmountFromForm,
  syncFixedReturnCurrentValue,
} from "@/lib/investments/utils";
import type { CollectionPeriod, Investment, InvestmentType } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils/format";

export type InvestmentFormState = {
  name: string;
  investmentType: InvestmentType;
  icon: string;
  color: string;
  costBasis: string;
  currentValue: string;
  quantity: string;
  unitLabel: string;
  notes: string;
  isFixedReturn: boolean;
  fixedReturnPercent: string;
  collectionPeriod: CollectionPeriod;
  collectionDate: string;
};

export function emptyInvestmentForm(): InvestmentFormState {
  return {
    name: "",
    investmentType: "stock",
    icon: defaultInvestmentIcon,
    color: defaultInvestmentColor,
    costBasis: "0",
    currentValue: "0",
    quantity: "",
    unitLabel: "",
    notes: "",
    isFixedReturn: false,
    fixedReturnPercent: "",
    collectionPeriod: "annual",
    collectionDate: "",
  };
}

export function investmentToForm(investment: Investment): InvestmentFormState {
  return {
    name: investment.name,
    investmentType: investment.investment_type,
    icon: investment.icon,
    color: investment.color,
    costBasis: String(investment.cost_basis),
    currentValue: String(investment.current_value),
    quantity: investment.quantity != null ? String(investment.quantity) : "",
    unitLabel: investment.unit_label ?? "",
    notes: investment.notes ?? "",
    isFixedReturn: investment.is_fixed_return,
    fixedReturnPercent:
      investment.fixed_return_percent != null ? String(investment.fixed_return_percent) : "",
    collectionPeriod: investment.collection_period ?? "annual",
    collectionDate: investment.collection_date ?? "",
  };
}

export function buildInvestmentPayload(
  form: InvestmentFormState,
  options?: { includeCurrentValue?: boolean },
) {
  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    investment_type: form.investmentType,
    icon: form.icon,
    color: form.color,
    cost_basis: Number(form.costBasis) || 0,
    quantity: form.isFixedReturn || !form.quantity.trim() ? null : Number(form.quantity) || 0,
    unit_label: form.isFixedReturn || !form.unitLabel.trim() ? null : form.unitLabel.trim(),
    notes: form.notes.trim() || null,
    is_fixed_return: form.isFixedReturn,
    fixed_return_percent:
      form.isFixedReturn && form.fixedReturnPercent.trim()
        ? Number(form.fixedReturnPercent) || 0
        : null,
    collection_period: form.isFixedReturn ? form.collectionPeriod : null,
    collection_date:
      form.isFixedReturn && form.collectionDate.trim() ? form.collectionDate : null,
  };

  if (options?.includeCurrentValue !== false) {
    payload.current_value = form.isFixedReturn
      ? Number(syncFixedReturnCurrentValue(form)) || 0
      : Number(form.costBasis) || 0;
  }

  return payload;
}

function patchForm(
  form: InvestmentFormState,
  patch: Partial<InvestmentFormState>,
): InvestmentFormState {
  const next = { ...form, ...patch };

  if (next.isFixedReturn) {
    next.currentValue = syncFixedReturnCurrentValue(next);
  }

  return next;
}

export default function InvestmentFormFields({
  form,
  onChange,
  idPrefix,
}: {
  form: InvestmentFormState;
  onChange: (next: InvestmentFormState) => void;
  idPrefix: string;
}) {
  return (
    <>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">اسم الاستثمار</span>
        <input
          id={`${idPrefix}-name`}
          type="text"
          required
          value={form.name}
          onChange={(event) => onChange(patchForm(form, { name: event.target.value }))}
          placeholder="مثال: شهادة 18% أو وديعة بنكية"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">نوع الاستثمار</span>
        <select
          id={`${idPrefix}-type`}
          value={form.investmentType}
          onChange={(event) =>
            onChange(
              patchForm(form, { investmentType: event.target.value as InvestmentType }),
            )
          }
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        >
          {investmentTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
        <input
          id={`${idPrefix}-fixed-return`}
          type="checkbox"
          checked={form.isFixedReturn}
          onChange={(event) =>
            onChange(
              patchForm(form, {
                isFixedReturn: event.target.checked,
                fixedReturnPercent: event.target.checked ? form.fixedReturnPercent : "",
                collectionPeriod: event.target.checked ? form.collectionPeriod : "annual",
                collectionDate: event.target.checked ? form.collectionDate : "",
              }),
            )
          }
          className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600"
        />
        <span>
          <span className="block text-sm font-medium text-slate-800">
            استثمار بربح ثابت وميعاد قبض
          </span>
          <span className="mt-1 block text-xs text-slate-600">
            مناسب للودائع والشهادات والاستثمارات اللي ليها ربح محدد وتاريخ استحقاق.
          </span>
        </span>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">المبلغ المستثمر</span>
        <input
          id={`${idPrefix}-cost`}
          type="number"
          min="0"
          step="0.01"
          value={form.costBasis}
          onChange={(event) => onChange(patchForm(form, { costBasis: event.target.value }))}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        />
      </label>

      {form.isFixedReturn ? (
        <>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">دورية القبض</span>
            <select
              id={`${idPrefix}-collection-period`}
              value={form.collectionPeriod}
              onChange={(event) =>
                onChange(
                  patchForm(form, {
                    collectionPeriod: event.target.value as CollectionPeriod,
                  }),
                )
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            >
              {collectionPeriodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">
                {getFixedReturnPercentLabel(form.collectionPeriod)}
              </span>
              <input
                id={`${idPrefix}-fixed-return-percent`}
                type="number"
                min="0"
                step="0.01"
                required
                value={form.fixedReturnPercent}
                onChange={(event) =>
                  onChange(patchForm(form, { fixedReturnPercent: event.target.value }))
                }
                placeholder={form.collectionPeriod === "monthly" ? "مثال: 1.5" : "مثال: 18"}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
              />
              {form.fixedReturnPercent.trim() && form.costBasis.trim() ? (
                <p className="text-xs text-amber-700">
                  {getExpectedProfitLabel(form.collectionPeriod)}:{" "}
                  {formatCurrency(
                    getFixedProfitAmountFromForm(form.costBasis, form.fixedReturnPercent),
                  )}
                </p>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">
                {getCollectionDateLabel(form.collectionPeriod)}
              </span>
              <input
                id={`${idPrefix}-collection-date`}
                type="date"
                required
                value={form.collectionDate}
                onChange={(event) =>
                  onChange(patchForm(form, { collectionDate: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">القيمة عند القبض</span>
            <input
              id={`${idPrefix}-value`}
              type="number"
              min="0"
              step="0.01"
              value={form.currentValue}
              readOnly
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
            />
            <p className="text-xs text-slate-500">
              تُحسب تلقائيًا = أصل المبلغ + ربح{" "}
              {form.collectionPeriod === "monthly" ? "الشهر" : "السنة"}
            </p>
          </label>
        </>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          حدّث القيمة من 📈 «المبلغ بقى كام دلوقتي»، أو سجّل أرباح فترة محددة من 💰.
        </div>
      )}

      {!form.isFixedReturn ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">الكمية (اختياري)</span>
            <input
              id={`${idPrefix}-quantity`}
              type="number"
              min="0"
              step="0.000001"
              value={form.quantity}
              onChange={(event) => onChange(patchForm(form, { quantity: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">الوحدة (اختياري)</span>
            <select
              id={`${idPrefix}-unit`}
              value={form.unitLabel}
              onChange={(event) => onChange(patchForm(form, { unitLabel: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            >
              <option value="">بدون</option>
              {investmentUnitOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">ملاحظات (اختياري)</span>
        <input
          id={`${idPrefix}-notes`}
          type="text"
          value={form.notes}
          onChange={(event) => onChange(patchForm(form, { notes: event.target.value }))}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        />
      </label>

      <div className="space-y-2">
        <span className="text-sm font-medium text-slate-700">الأيقونة</span>
        <div className="grid grid-cols-8 gap-2 sm:grid-cols-12">
          {investmentIconOptions.map((option) => (
            <button
              key={`${idPrefix}-${option}`}
              type="button"
              onClick={() => onChange(patchForm(form, { icon: option }))}
              className={`flex h-10 items-center justify-center rounded-xl text-lg ${
                form.icon === option ? "bg-emerald-100 ring-2 ring-emerald-500" : "bg-slate-50"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium text-slate-700">اللون</span>
        <div className="flex flex-wrap gap-2">
          {investmentColorOptions.map((option) => (
            <button
              key={`${idPrefix}-${option}`}
              type="button"
              onClick={() => onChange(patchForm(form, { color: option }))}
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
