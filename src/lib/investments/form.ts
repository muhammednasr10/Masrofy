import { defaultInvestmentColor, defaultInvestmentIcon } from "@/lib/constants/investment-options";
import { goldUnitLabel, parseGoldKarat, type GoldKarat } from "@/lib/investments/gold-price";
import { syncFixedReturnCurrentValue } from "@/lib/investments/utils";
import type { CollectionPeriod, Investment, InvestmentType } from "@/lib/types/database";

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

export function patchInvestmentForm(
  form: InvestmentFormState,
  patch: Partial<InvestmentFormState>,
): InvestmentFormState {
  const next = { ...form, ...patch };

  if (next.isFixedReturn) {
    next.currentValue = syncFixedReturnCurrentValue(next);
  }

  return next;
}
