import type { RecurringFrequency } from "@/lib/types/database";

export const recurringFrequencyOptions: Array<{ value: RecurringFrequency; label: string }> = [
  { value: "weekly", label: "أسبوعي" },
  { value: "monthly", label: "شهري" },
  { value: "yearly", label: "سنوي" },
];
