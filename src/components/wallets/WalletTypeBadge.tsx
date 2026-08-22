type WalletTypeBadgeProps = {
  label: string;
  isInvestment: boolean;
};

export default function WalletTypeBadge({ label, isInvestment }: WalletTypeBadgeProps) {
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-xs font-medium ${
        isInvestment ? "bg-indigo-50 text-indigo-700" : "bg-slate-100/80 text-slate-500"
      }`}
    >
      {label}
    </span>
  );
}
