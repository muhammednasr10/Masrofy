import type { RecurringFrequency, TransactionType } from "@/lib/types/database";

export type RecurringFormState = {
  title: string;
  walletId: string;
  categoryId: string;
  amount: string;
  type: TransactionType;
  note: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate: string;
};

export function emptyRecurringForm(
  walletId = "",
  categoryId = "",
  startDate = new Date().toISOString().slice(0, 10),
): RecurringFormState {
  return {
    title: "",
    walletId,
    categoryId,
    amount: "",
    type: "expense",
    note: "",
    frequency: "monthly",
    startDate,
    endDate: "",
  };
}

export function buildRecurringPayload(form: RecurringFormState) {
  return {
    title: form.title.trim(),
    wallet_id: form.walletId,
    category_id: form.type === "income" && !form.categoryId ? null : form.categoryId || null,
    amount: Number(form.amount) || 0,
    type: form.type,
    note: form.note.trim() || null,
    frequency: form.frequency,
    start_date: form.startDate,
    next_due_date: form.startDate,
    end_date: form.endDate.trim() || null,
    is_active: true,
  };
}
