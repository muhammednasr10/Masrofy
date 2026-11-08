/** Round to fils/piastres (2 decimal places) to avoid float artifacts like 867.9999999999986. */
export function roundMoney(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Stable string for money inputs (no long float tails). */
export function formatMoneyInput(value: number) {
  const rounded = roundMoney(value);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}
