import type { CollectionPeriod, InvestmentType } from "@/lib/types/database";

export const investmentTypeOptions: Array<{ value: InvestmentType; label: string }> = [
  { value: "stock", label: "أسهم" },
  { value: "gold", label: "ذهب" },
  { value: "crypto", label: "عملات رقمية" },
  { value: "fund", label: "صناديق استثمار" },
  { value: "real_estate", label: "عقار" },
  { value: "other", label: "أخرى" },
];

export const investmentIconOptions = [
  "📈",
  "📊",
  "💰",
  "🪙",
  "💎",
  "🏠",
  "🏦",
  "🌐",
  "⚡",
  "🏛️",
  "💼",
  "🔒",
];

export const investmentColorOptions = [
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#06b6d4",
  "#14b8a6",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#64748b",
  "#a16207",
];

export const defaultInvestmentIcon = investmentIconOptions[0];
export const defaultInvestmentColor = investmentColorOptions[0];

export const investmentUnitOptions = ["سهم", "جرام", "وحدة", "عملة", "متر"];

export const collectionPeriodOptions: Array<{
  value: CollectionPeriod;
  label: string;
}> = [
  { value: "monthly", label: "شهري" },
  { value: "annual", label: "سنوي" },
];
