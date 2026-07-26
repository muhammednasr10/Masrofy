import type { CardKind, WalletType } from "@/lib/types/database";

export type { WalletType };

export const walletTypeOptions: Array<{ value: WalletType; label: string }> = [
  { value: "bank", label: "بنك" },
  { value: "cash", label: "كاش" },
  { value: "wallet", label: "محفظة إلكترونية" },
  { value: "card", label: "بطاقة" },
  { value: "investment", label: "استثمار" },
];

export const cardKindOptions: Array<{ value: CardKind; label: string }> = [
  { value: "debit", label: "بطاقة خصم (Debit)" },
  { value: "credit", label: "بطاقة ائتمان (Credit)" },
];

export const walletIconOptions = [
  "🏦",
  "🏛️",
  "💳",
  "💵",
  "💰",
  "👛",
  "📱",
  "💎",
  "🪙",
  "🏧",
  "💼",
  "🏠",
  "📈",
];

export const walletColorOptions = [
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#06b6d4",
  "#14b8a6",
  "#22c55e",
  "#84cc16",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#64748b",
];

export const defaultWalletColor = walletColorOptions[0];
export const defaultWalletIcon = "🏦";

export const defaultWalletsSeed = [
  { name: "بنك مصر", wallet_type: "bank" as const, icon: "🏦", color: "#3b82f6", is_default: true },
  { name: "بنك CIB", wallet_type: "bank" as const, icon: "🏦", color: "#6366f1", is_default: false },
  { name: "محفظة شخصية", wallet_type: "cash" as const, icon: "💵", color: "#22c55e", is_default: false },
];
