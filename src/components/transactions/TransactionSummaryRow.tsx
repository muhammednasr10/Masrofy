type TransactionSummaryRowProps = {
  date: string;
  primaryLabel: string;
  secondaryLabel?: string;
  metaLabel?: string;
  amount: string;
  amountTone: "expense" | "income";
  iconPrefix?: string;
};

export default function TransactionSummaryRow({
  date,
  primaryLabel,
  secondaryLabel,
  metaLabel,
  amount,
  amountTone,
  iconPrefix,
}: TransactionSummaryRowProps) {
  const amountClass = amountTone === "expense" ? "text-red-600" : "text-emerald-600";
  const amountPrefix = amountTone === "expense" ? "-" : "+";

  return (
    <li className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500">{date}</p>
        <p className="mt-0.5 wrap-text text-sm font-medium text-slate-900">
          {iconPrefix ? `${iconPrefix} ` : null}
          {primaryLabel}
        </p>
        {secondaryLabel ? (
          <p className="mt-0.5 wrap-text text-xs text-slate-500">{secondaryLabel}</p>
        ) : null}
        {metaLabel ? <p className="mt-0.5 text-xs text-slate-400">{metaLabel}</p> : null}
      </div>
      <p className={`amount-inline shrink-0 ${amountClass}`}>
        {amountPrefix}
        {amount}
      </p>
    </li>
  );
}
