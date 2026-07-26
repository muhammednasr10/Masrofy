import type { RecurringFrequency, RecurringTransaction } from "@/lib/types/database";

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getTodayDateString(referenceDate = new Date()) {
  return formatLocalDate(referenceDate);
}

export function calculateNextDueDate(
  frequency: RecurringFrequency,
  currentDueDate: string,
): string {
  const date = parseLocalDate(currentDueDate);

  if (frequency === "weekly") {
    date.setDate(date.getDate() + 7);
  } else if (frequency === "monthly") {
    date.setMonth(date.getMonth() + 1);
  } else {
    date.setFullYear(date.getFullYear() + 1);
  }

  return formatLocalDate(date);
}

export function isRecurringExpired(
  recurring: Pick<RecurringTransaction, "end_date" | "next_due_date">,
) {
  return recurring.end_date != null && recurring.next_due_date > recurring.end_date;
}

export function isRecurringDue(
  recurring: Pick<RecurringTransaction, "is_active" | "next_due_date" | "end_date">,
  today = getTodayDateString(),
) {
  if (!recurring.is_active) {
    return false;
  }

  if (recurring.end_date && recurring.next_due_date > recurring.end_date) {
    return false;
  }

  return recurring.next_due_date <= today;
}

export function isRecurringOverdue(
  recurring: Pick<RecurringTransaction, "next_due_date">,
  today = getTodayDateString(),
) {
  return recurring.next_due_date < today;
}

export function getDueRecurringTransactions(
  recurrings: RecurringTransaction[],
  today = getTodayDateString(),
) {
  return recurrings.filter((recurring) => isRecurringDue(recurring, today));
}

export function getFrequencyLabel(frequency: RecurringFrequency) {
  if (frequency === "weekly") {
    return "أسبوعي";
  }

  if (frequency === "yearly") {
    return "سنوي";
  }

  return "شهري";
}

export function getDueStatusLabel(
  recurring: Pick<RecurringTransaction, "next_due_date">,
  today = getTodayDateString(),
) {
  if (recurring.next_due_date === today) {
    return "مستحق اليوم";
  }

  if (recurring.next_due_date < today) {
    return "متأخر";
  }

  return "قادم";
}

export function advanceRecurringDueDate(
  recurring: Pick<RecurringTransaction, "frequency" | "next_due_date" | "end_date">,
) {
  const nextDueDate = calculateNextDueDate(recurring.frequency, recurring.next_due_date);

  while (recurring.end_date && nextDueDate > recurring.end_date) {
    break;
  }

  return nextDueDate;
}
