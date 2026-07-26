import type { Wallet } from "@/lib/types/database";
import { isCreditWallet } from "@/lib/wallets/balance";
import { formatCurrency } from "@/lib/utils/format";

type WalletBalanceRow = {
  wallet: Pick<Wallet, "id" | "name" | "icon" | "color" | "card_kind">;
  depth: number;
  balance: number;
  creditAvailable: number | null;
};

export default function WalletBalancesReport({
  balances,
  currency,
}: {
  balances: WalletBalanceRow[];
  currency: string;
}) {
  if (balances.length === 0) {
    return <p className="text-sm text-slate-500">لا توجد محافظ بعد.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {balances.map(({ wallet, depth, balance, creditAvailable }) => (
        <article
          key={wallet.id}
          className="rounded-2xl border border-slate-100 p-4"
          style={{
            backgroundColor: `${wallet.color}10`,
            marginRight: `${depth * 0.5}rem`,
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
              style={{ backgroundColor: `${wallet.color}25` }}
            >
              {wallet.icon}
            </span>
            <div>
              <p className="font-medium text-slate-900">{wallet.name}</p>
              {isCreditWallet(wallet) ? (
                <>
                  <p className="text-lg font-semibold text-red-600">
                    مستحق: {formatCurrency(balance, currency)}
                  </p>
                  {creditAvailable != null ? (
                    <p className="text-xs text-emerald-700">
                      متاح: {formatCurrency(creditAvailable, currency)}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-lg font-semibold text-slate-900">
                  {formatCurrency(balance, currency)}
                </p>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
