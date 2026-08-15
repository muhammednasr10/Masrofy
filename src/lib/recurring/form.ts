import type {
  RecurringFrequency,
  RecurringTransaction,
  TransactionType,
} from "@/lib/types/database";

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

function recurringFieldsFromForm(form: RecurringFormState) {
  return {
    title: form.title.trim(),
    wallet_id: form.walletId,
    category_id: form.type === "income" && !form.categoryId ? null : form.categoryId || null,
    amount: Number(form.amount) || 0,
    type: form.type,
    note: form.note.trim() || null,
    frequency: form.frequency,
    end_date: form.endDate.trim() || null,
  };
}

export function buildRecurringPayload(form: RecurringFormState) {
  return {
    ...recurringFieldsFromForm(form),
    start_date: form.startDate,
    next_due_date: form.startDate,
    is_active: true,
  };
}

export function recurringToFormState(recurring: RecurringTransaction): RecurringFormState {
  return {
    title: recurring.title,
    walletId: recurring.wallet_id,
    categoryId: recurring.category_id ?? "",
    amount: String(recurring.amount),
    type: recurring.type,
    note: recurring.note ?? "",
    frequency: recurring.frequency,
    startDate: recurring.next_due_date.slice(0, 10),
    endDate: recurring.end_date?.slice(0, 10) ?? "",
  };
}

export function buildRecurringUpdatePayload(form: RecurringFormState) {
  return {
    ...recurringFieldsFromForm(form),
    next_due_date: form.startDate,
  };
}
