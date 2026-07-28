export const ADD_EXPENSE_QUERY = "add";

export function buildAddExpenseHref() {
  return `/expenses?${ADD_EXPENSE_QUERY}=1`;
}
