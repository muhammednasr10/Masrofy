export const ONBOARDING_CATEGORY_PRESETS = [
  { name: "طعام", icon: "🍔", color: "#f97316" },
  { name: "مواصلات", icon: "🚗", color: "#3b82f6" },
  { name: "فواتير", icon: "💡", color: "#eab308" },
  { name: "تسوق", icon: "🛒", color: "#ec4899" },
  { name: "صحة", icon: "💊", color: "#22c55e" },
  { name: "ترفيه", icon: "🎬", color: "#a855f7" },
  { name: "ادّخار", icon: "🎯", color: "#10b981" },
  { name: "أخرى", icon: "📦", color: "#64748b" },
];

export const ONBOARDING_WALLET_TYPES = [
  { value: "bank", label: "بنك", icon: "🏦" },
  { value: "cash", label: "كاش", icon: "💵" },
  { value: "wallet", label: "محفظة إلكترونية", icon: "📱" },
] as const;

export const ONBOARDING_PLAN_CATEGORY_RATIOS: Record<string, number> = {
  طعام: 0.2,
  فواتير: 0.15,
  مواصلات: 0.1,
};
