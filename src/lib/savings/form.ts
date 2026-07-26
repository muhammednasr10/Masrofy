import type { SavingsGoal } from "@/lib/types/database";

export type SavingsGoalFormState = {
  name: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string;
  icon: string;
  color: string;
  notes: string;
};

export function emptySavingsGoalForm(): SavingsGoalFormState {
  return {
    name: "",
    targetAmount: "",
    currentAmount: "0",
    targetDate: "",
    icon: "🎯",
    color: "#10b981",
    notes: "",
  };
}

export function savingsGoalToForm(goal: SavingsGoal): SavingsGoalFormState {
  return {
    name: goal.name,
    targetAmount: String(goal.target_amount),
    currentAmount: String(goal.current_amount),
    targetDate: goal.target_date ?? "",
    icon: goal.icon,
    color: goal.color,
    notes: goal.notes ?? "",
  };
}

export function buildSavingsGoalPayload(form: SavingsGoalFormState, userId: string) {
  return {
    user_id: userId,
    name: form.name.trim(),
    target_amount: Number(form.targetAmount),
    current_amount: Number(form.currentAmount || 0),
    target_date: form.targetDate || null,
    icon: form.icon.trim() || "🎯",
    color: form.color.trim() || "#10b981",
    notes: form.notes.trim() || null,
    is_completed: Number(form.currentAmount || 0) >= Number(form.targetAmount),
  };
}
