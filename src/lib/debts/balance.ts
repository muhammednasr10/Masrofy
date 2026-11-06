export const DEBT_DIRECTIONS = ["i_owe", "owed_to_me"] as const;

export type DebtDirection = (typeof DEBT_DIRECTIONS)[number];

export function isDebtDirection(value: string): value is DebtDirection {
  return value === "i_owe" || value === "owed_to_me";
}

export function debtRemaining(principal: number, paid: number) {
  const remaining = Number(principal) - Number(paid);

  if (!(remaining > 0)) {
    return 0;
  }

  return Math.round(remaining * 100) / 100;
}

export function paidByDebt(payments: Array<{ debt_id: string; amount: number }>) {
  const totals = new Map<string, number>();

  for (const payment of payments) {
    totals.set(payment.debt_id, (totals.get(payment.debt_id) ?? 0) + Number(payment.amount));
  }

  return totals;
}

/** Payments on or before asOf count as paid. Later dates stay scheduled. */
export function splitDebtPayments(
  payments: Array<{ debt_id: string; amount: number; paid_on: string }>,
  asOf: string,
) {
  const settled = new Map<string, number>();
  const scheduled = new Map<string, number>();

  for (const payment of payments) {
    const bucket = payment.paid_on.slice(0, 10) > asOf ? scheduled : settled;
    bucket.set(payment.debt_id, (bucket.get(payment.debt_id) ?? 0) + Number(payment.amount));
  }

  return { settled, scheduled };
}

export function summarizeDebts(
  rows: Array<{ direction: DebtDirection; principal: number; paid: number }>,
) {
  return rows.reduce(
    (summary, row) => {
      const remaining = debtRemaining(row.principal, row.paid);

      if (row.direction === "i_owe") {
        summary.iOwe += remaining;
      } else {
        summary.owedToMe += remaining;
      }

      return summary;
    },
    { iOwe: 0, owedToMe: 0 },
  );
}
