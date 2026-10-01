export const SELECTED_MONTH_STORAGE_KEY = "masrofy_selected_month";

const PLAN_MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isPlanMonthKey(value: string) {
  return PLAN_MONTH_KEY_PATTERN.test(value);
}

export function readStoredPlanMonthKey(storage: Pick<Storage, "getItem"> | null | undefined) {
  const value = storage?.getItem(SELECTED_MONTH_STORAGE_KEY);

  if (!value || !isPlanMonthKey(value)) {
    return null;
  }

  return value;
}
