import type { ReconciliationResolution } from "@/lib/types/database";

export const reconciliationResolutionOptions: Array<{
  value: ReconciliationResolution;
  label: string;
  description: string;
}> = [
  {
    value: "adjust_opening",
    label: "تعديل الرصيد الافتتاحي",
    description: "يعدّل الرصيد الافتتاحي بصمت ليطابق الواقع بدون معاملة ظاهرة.",
  },
  {
    value: "adjustment_tx",
    label: "معاملة تسوية",
    description: "ينشئ معاملة دخل أو مصروف بفرق الجرد.",
  },
  {
    value: "log_only",
    label: "تسجيل فقط",
    description: "يسجّل الفرق في سجل الجرد بدون تعديل الأرصدة.",
  },
];

export function getReconciliationResolutionLabel(resolution: ReconciliationResolution) {
  if (resolution === "matched") {
    return "متطابق";
  }

  return (
    reconciliationResolutionOptions.find((option) => option.value === resolution)?.label ??
    resolution
  );
}
