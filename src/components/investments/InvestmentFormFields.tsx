"use client";

import { useEffect, useState } from "react";
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
  GOLD_KARATS,
  goldCostFromGrams,
  goldUnitLabel,
  parseGoldKarat,
  type GoldKarat,
  type GoldPriceQuote,
} from "@/lib/investments/gold-price";
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
  goldKarat: GoldKarat;
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
    goldKarat: 21,
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
    goldKarat: parseGoldKarat(investment.unit_label) ?? 21,
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
  const isGold = form.investmentType === "gold";
  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    investment_type: form.investmentType,
    icon: form.icon,
    color: form.color,
    cost_basis: Number(form.costBasis) || 0,
    quantity:
      isGold || (!form.isFixedReturn && form.quantity.trim())
        ? Number(form.quantity) || 0
        : null,
    unit_label: isGold
      ? goldUnitLabel(form.goldKarat)
      : form.isFixedReturn || !form.unitLabel.trim()
        ? null
        : form.unitLabel.trim(),
    notes: form.notes.trim() || null,
    is_fixed_return: isGold ? false : form.isFixedReturn,
    fixed_return_percent:
      !isGold && form.isFixedReturn && form.fixedReturnPercent.trim()
        ? Number(form.fixedReturnPercent) || 0
        : null,
    collection_period: !isGold && form.isFixedReturn ? form.collectionPeriod : null,
    collection_date:
      !isGold && form.isFixedReturn && form.collectionDate.trim() ? form.collectionDate : null,
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
  const isGold = form.investmentType === "gold";
  const [goldQuote, setGoldQuote] = useState<GoldPriceQuote | null>(null);
  const [goldPriceLoading, setGoldPriceLoading] = useState(false);
  const [goldPriceError, setGoldPriceError] = useState<string | null>(null);

  useEffect(() => {
    if (!isGold) {
      return;
    }

    const controller = new AbortController();
    setGoldPriceLoading(true);
    setGoldPriceError(null);

    void (async () => {
      try {
        const response = await fetch("/api/gold-price", { signal: controller.signal });
        const payload = (await response.json()) as { quote?: GoldPriceQuote; error?: string };

        if (!response.ok || !payload.quote) {
          throw new Error(payload.error ?? "تعذر جلب سعر الذهب الآن.");
        }

        if (!controller.signal.aborted) {
          setGoldQuote(payload.quote);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setGoldQuote(null);
        setGoldPriceError(error instanceof Error ? error.message : "تعذر جلب سعر الذهب الآن.");
      } finally {
        if (!controller.signal.aborted) {
          setGoldPriceLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [isGold]);

  useEffect(() => {
    if (!isGold || !goldQuote) {
      return;
    }

    const grams = Number(form.quantity);
    const price = goldQuote.prices[form.goldKarat];
    const nextCost = goldCostFromGrams(grams, price);

    if (nextCost <= 0) {
      return;
    }

    const nextCostText = String(nextCost);
    const nextUnit = goldUnitLabel(form.goldKarat);

    if (nextCostText === form.costBasis && form.unitLabel === nextUnit) {
      return;
    }

    onChange(
      patchForm(form, {
        costBasis: nextCostText,
        unitLabel: nextUnit,
      }),
    );
    // Recalculate once when the live quote arrives or karat/grams change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional field sync
  }, [form.goldKarat, form.quantity, goldQuote, isGold]);

  function applyGoldFields(patch: Partial<InvestmentFormState>) {
    const next = patchForm(form, {
      ...patch,
      investmentType: "gold",
      isFixedReturn: false,
      unitLabel: goldUnitLabel(patch.goldKarat ?? form.goldKarat),
    });

    if (goldQuote) {
      const grams = Number(next.quantity);
      const price = goldQuote.prices[next.goldKarat];
      const nextCost = goldCostFromGrams(grams, price);
      if (nextCost > 0) {
        next.costBasis = String(nextCost);
      }
    }

    onChange(next);
  }

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
          placeholder={isGold ? "مثال: سلسلة ذهب أو سبيكة" : "مثال: شهادة 18% أو وديعة بنكية"}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">نوع الاستثمار</span>
        <select
          id={`${idPrefix}-type`}
          value={form.investmentType}
          onChange={(event) => {
            const nextType = event.target.value as InvestmentType;

            if (nextType === "gold") {
              applyGoldFields({
                investmentType: "gold",
                icon: "🪙",
                color: "#eab308",
                unitLabel: goldUnitLabel(form.goldKarat),
              });
              return;
            }

            onChange(
              patchForm(form, {
                investmentType: nextType,
                unitLabel: form.unitLabel.startsWith("عيار") ? "" : form.unitLabel,
              }),
            );
          }}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        >
          {investmentTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {isGold ? (
        <div className="space-y-4 rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">العيار</span>
              <select
                id={`${idPrefix}-gold-karat`}
                value={form.goldKarat}
                onChange={(event) =>
                  applyGoldFields({ goldKarat: Number(event.target.value) as GoldKarat })
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
              >
                {GOLD_KARATS.map((karat) => (
                  <option key={karat} value={karat}>
                    عيار {karat}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">الكمية بالجرام</span>
              <input
                id={`${idPrefix}-gold-grams`}
                type="number"
                min="0.001"
                step="0.001"
                required
                value={form.quantity}
                onChange={(event) => applyGoldFields({ quantity: event.target.value })}
                placeholder="مثال: 10"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
              />
            </label>
          </div>

          {goldPriceLoading ? (
            <p className="text-sm text-slate-600">جاري جلب سعر الجرام من النت...</p>
          ) : goldPriceError ? (
            <p className="text-sm text-red-600">{goldPriceError}</p>
          ) : goldQuote ? (
            <p className="text-sm text-amber-900">
              سعر جرام عيار {form.goldKarat}:{" "}
              <span className="font-semibold">
                {formatCurrency(goldQuote.prices[form.goldKarat])}
              </span>
              <span className="mt-1 block text-xs text-amber-800/80">
                السعر بيتحدث أوتوماتيك، والمبلغ المستثمر بيتحسب من العيار والجرام.
              </span>
            </p>
          ) : null}
        </div>
      ) : (
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
      )}

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
        {isGold ? (
          <p className="text-xs text-slate-500">تقدر تعدّل المبلغ لو اشتريت بسعر مختلف عن السوق.</p>
        ) : null}
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

      {!form.isFixedReturn && !isGold ? (
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
