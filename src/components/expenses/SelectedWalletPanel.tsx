import type { TransactionType } from "@/lib/types/database";
import { getCreditTransactionHint } from "@/lib/expenses/display";
import { formatCurrency } from "@/lib/utils/format";

type SelectedWalletSnapshot = {
  wallet: {
    icon: string;
    name: string;
    color: string;
  };
  parent: {
    icon: string;
    name: string;
  } | null;
  typeLabel: string | null;
  isCredit: boolean;
  balance: number;
  creditAvailable: number | null;
};

export default function SelectedWalletPanel({
  snapshot,
  type,
  currency,
}: {
  snapshot: SelectedWalletSnapshot | null;
  type: TransactionType;
  currency: string;
}) {
  if (!snapshot) {
    return null;
  }

  return (
    <div
      className="rounded-2xl border border-slate-100 px-4 py-3"
      style={{ backgroundColor: `${snapshot.wallet.color}10` }}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-lg"
          style={{ backgroundColor: `${snapshot.wallet.color}25` }}
        >
          {snapshot.wallet.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900">{snapshot.wallet.name}</p>
          {snapshot.parent ? (
            <p className="text-xs text-slate-500">
              {snapshot.parent.icon} {snapshot.parent.name}
            </p>
          ) : null}
          {snapshot.typeLabel ? (
            <p className="text-xs text-slate-500">{snapshot.typeLabel}</p>
          ) : null}
          {snapshot.isCredit ? (
            <>
              <p className="mt-1 text-sm font-semibold text-red-600">
                مستحق: {formatCurrency(snapshot.balance, currency)}
              </p>
              {snapshot.creditAvailable != null ? (
                <p className="text-xs text-emerald-700">
                  متاح: {formatCurrency(snapshot.creditAvailable, currency)}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-amber-700">
                {getCreditTransactionHint(type)}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm font-semibold text-slate-900">
              الرصيد: {formatCurrency(snapshot.balance, currency)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
